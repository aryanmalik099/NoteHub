from flask import request, jsonify, Blueprint
from sqlalchemy.orm import joinedload
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from functools import wraps
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, create_refresh_token, get_jwt, verify_jwt_in_request
import secrets
from datetime import date, datetime, timedelta
from .email import send_password_reset_email
from .utils import upload_file_to_firebase, delete_file_from_firebase
from .models import User, Note, Log, Department, Course, AcademicSession, Section
from .logger import log_activity
from . import db

# Create a Blueprint
api = Blueprint('api', __name__)

# Define the allowed file extensions
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}

# Helper function to check if the file extension is allowed
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def super_admin_required():
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            if request.method == 'OPTIONS':
                return fn(*args, **kwargs)
            verify_jwt_in_request()
            claims = get_jwt()
            if claims.get("role") == 'super_admin':
                return fn(*args, **kwargs)
            else:
                return jsonify(error="Super admin access required"), 403
        return decorator
    return wrapper

@api.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    username = data.get('username')

    if not email or not password or not username:
        return jsonify({"error": "Missing required fields"}), 400

    # 1. Enforce college email domain
    if not email.endswith('@imsec.ac.in'):
        return jsonify({"error": "Only college email addresses (@imsec.ac.in) are allowed."}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email address already in use"}), 409
    
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already in use"}), 409
    
    hashed_password = generate_password_hash(password, method='pbkdf2:sha256')

    # 2. Automatically derive the College ID from the email
    college_id = email.split('@')[0].upper()

    new_user = User(
        username=username,
        email=email,
        password_hash=hashed_password,
        college_id=college_id
    )

    # 3. Automatically parse department and admission year from the derived ID
    try:
        admission_year_str = college_id[1:5]
        department_short_name = college_id[5:-5]
        department = Department.query.filter_by(short_name=department_short_name).first()

        if department:
            new_user.department_id = department.id
            new_user.admission_year = int(admission_year_str)
        else:
            print(f"Warning: Department '{department_short_name}' not found for College ID '{college_id}'")
    except (IndexError, ValueError) as e:
        print(f"Could not parse College ID '{college_id}': {e}")

    db.session.add(new_user)
    db.session.commit()
    log_activity('user_signup', f"New user '{new_user.username}' created with College ID '{college_id}'.")

    return jsonify({"message": "User created successfully!"}), 201

@api.route('/login', methods=['POST'])
def login():
    # 1. Get the data from the request
    data = request.get_json()
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"error": "Missing username or password"}), 400

    # 2. Find the user in the database by their username
    user = User.query.filter_by(username=data.get('username')).first()

    # 3. Check if the user exists and if the password is correct
    if not user or not check_password_hash(user.password_hash, data.get('password')):
        return jsonify({"error": "Invalid username or password"}), 401
    
    additional_claims = {"role": user.role}

     # Create both an access token and a refresh token
    access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
    refresh_token = create_refresh_token(identity=str(user.id))
    log_activity('user_login', f"User '{user.username}' logged in.")
    return jsonify(access_token=access_token, refresh_token=refresh_token), 200

@api.route('/profile/change-password', methods=['POST'])
@jwt_required()
def change_password():
    # 1. Get the current user's ID from the token
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    # 2. Get the password data from the request
    data = request.get_json()
    current_password = data.get('current_password')
    new_password = data.get('new_password')

    if not current_password or not new_password:
        return jsonify({"error": "Current and new passwords are required"}), 400

    # 3. Verify the user's current password
    if not check_password_hash(user.password_hash, current_password):
        return jsonify({"error": "Invalid current password"}), 401

    # 4. Hash the new password and update the user record
    user.password_hash = generate_password_hash(new_password, method='pbkdf2:sha256')
    db.session.commit()

    return jsonify({"message": "Password updated successfully"}), 200


@api.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    user = User.query.filter_by(email=data.get('email')).first()
    if user:
        # Generate a secure token
        token = secrets.token_urlsafe(32)
        user.reset_token = token
        user.reset_token_expiration = datetime.utcnow() + timedelta(hours=1)
        db.session.commit()

        # Send the email
        send_password_reset_email(user, token)

    # Always return a success message to prevent email enumeration
    return jsonify({"message": "If an account with that email exists, a password reset link has been sent."}), 200

@api.route('/reset-password/<token>', methods=['POST'])
def reset_password(token):
    # Find the user by the token and check if the token is still valid
    user = User.query.filter_by(reset_token=token).first()
    if not user or user.reset_token_expiration < datetime.utcnow():
        return jsonify({"error": "Invalid or expired password reset token."}), 400

    data = request.get_json()
    new_password = data.get('new_password')

    # Update password and invalidate the token
    user.password_hash = generate_password_hash(new_password, method='pbkdf2:sha256')
    user.reset_token = None
    user.reset_token_expiration = None
    db.session.commit()

    return jsonify({"message": "Your password has been successfully reset."}), 200

@api.route('/refresh', methods=['POST'])
@jwt_required(refresh=True) # <-- Note the 'refresh=True' argument
def refresh():
    # The get_jwt_identity() function works here too,
    # reading the identity from the refresh token.
    current_user_id = get_jwt_identity()
    
    # Create a new access token
    new_access_token = create_access_token(identity=current_user_id)
    
    # Return the new token
    return jsonify(access_token=new_access_token), 200

@api.route('/notes/upload', methods=['POST'])
@jwt_required()
def upload_note(): 
    try:
        current_user_id = int(get_jwt_identity())
        claims = get_jwt()
        user_role = claims.get('role')
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid user identity in token"}), 401

    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if not allowed_file(file.filename):
        return jsonify({"error": "File type not allowed. Accepted types are PDF, PNG, and JPG."}), 400

    # Get form data
    title = request.form.get('title')
    subject = request.form.get('subject')
    semester_str = request.form.get('semester')
    academic_year = request.form.get('academic_year')
    # Add any other fields you need, like description or professor

    # Basic presence validation first
    if not all([title, subject, semester_str, academic_year]):
        return jsonify({"error": "Missing required form fields"}), 400

    # Validate numeric fields
    try:
        semester = int(semester_str)
    except ValueError:
        return jsonify({"error": "semester must be integers"}), 400

    # 2. Upload the file to Firebase
    try:
        file_url = upload_file_to_firebase(file)
        if not file_url:
            return jsonify({"error": "Failed to upload file to storage"}), 502
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    # 3. Save the note's information to the database
    new_note = Note(
        title=title,
        file_url=file_url,
        subject=subject,
        semester=semester,
        academic_year=academic_year,
        user_id=current_user_id,
        is_verified=(user_role == 'professor')
    )
    db.session.add(new_note)
    db.session.commit()
    log_activity('note_upload', f"Note '{new_note.title}' uploaded by user ID {current_user_id}.")
    return jsonify({"message": "Note uploaded successfully!", "file_url": file_url}), 201


@api.route('/notes', methods=['GET'])
def get_notes():
    page = request.args.get('page', 1, type=int)
    per_page = 10

    subject = request.args.get('subject')
    academic_year = request.args.get('academic_year')
    title = request.args.get('title')
    verified_only = request.args.get('verified', 'false').lower() == 'true'

    query = Note.query

    if title:
        query = query.filter(Note.title.ilike(f'%{title}%'))
    if subject:
        query = query.filter(Note.subject.ilike(f'%{subject}%'))
    if academic_year:
        query = query.filter(Note.academic_year.ilike(f'%{academic_year}%'))
    if verified_only:
        query = query.filter(Note.is_verified == True)

    pagination = query.order_by(Note.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    notes = pagination.items

    notes_list = []
    for note in notes:
        author_username = "Unknown"
        if note.author:
            author_username = note.author.username
        
        note_data = {
            'id': note.id,
            'title': note.title,
            'description': note.description,
            'file_url': note.file_url,
            'subject': note.subject,
            'semester': note.semester,
            'academic_year': note.academic_year,
            'created_at': note.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'author_username': author_username,
            'user_id': note.user_id,
            'is_verified': note.is_verified
        }
        notes_list.append(note_data)
        
    return jsonify({
        'notes': notes_list,
        'total_pages': pagination.pages,
        'current_page': pagination.page,
        'total_notes': pagination.total
    })

@api.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    user_data = {
        'username': user.username,
        'email': user.email,
        'role': user.role
    }
    return jsonify(user_data)

@api.route('/notes/my_notes', methods=['GET'])
@jwt_required()
def get_my_notes():
    current_user_id = get_jwt_identity()
    
    # Query the database for notes linked to the current user ID
    notes = Note.query.filter_by(user_id=current_user_id).order_by(Note.created_at.desc()).all()
    
    # Create a list of dictionaries, one for each note.
    notes_list = []
    for note in notes:
        note_data = {
            'id': note.id,
            'title': note.title,
            'description': note.description,
            'file_url': note.file_url,
            'subject': note.subject,
            'semester': note.semester,
            'academic_year': note.academic_year,
            'created_at': note.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }
        notes_list.append(note_data)
        
    return jsonify(notes_list)


@api.route('/notes/<int:note_id>', methods=['DELETE'])
@jwt_required()
def delete_note(note_id):
    current_user_id = int(get_jwt_identity())
    # 1. Get the full user object for the logged-in user to check their role
    current_user = User.query.get(current_user_id)
    
    note = Note.query.get(note_id)
    if not note:
        return jsonify({"error": "Note not found"}), 404

    # 2. New Permission Check:
    # Allow deletion if the user is the author OR if the user is a moderator
    if note.user_id != current_user.id and current_user.role not in ['moderator', 'super_admin']:
        return jsonify({"error": "Forbidden: You do not have permission to delete this note"}), 403

    # The rest of the delete logic remains the same
    try:
        delete_file_from_firebase(note.file_url)
        db.session.delete(note)
        db.session.commit()
        log_activity('note_delete', f"Note ID {note_id} deleted by user ID {current_user_id}.")
        return jsonify({"message": "Note deleted successfully"}), 200
    
    except Exception as e:
        db.session.rollback()
        print(f"An error occurred during note deletion: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500


@api.route('/notes/<int:note_id>', methods=['PUT'])
@jwt_required()
def update_note(note_id):
    current_user_id = int(get_jwt_identity())
    
    # 1. Find the note in the database
    note = Note.query.get(note_id)
    if not note:
        return jsonify({"error": "Note not found"}), 404

    # 2. Verify that the current user is the author of the note
    if note.user_id != current_user_id:
        return jsonify({"error": "Forbidden: You do not have permission to edit this note"}), 403

    # 3. Get the updated data from the request body
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    # 4. Update the note's fields with the new data
    # Using .get() allows for partial updates (e.g., only sending the title)
    note.title = data.get('title', note.title)
    note.subject = data.get('subject', note.subject)
    note.semester = data.get('semester', note.semester)
    note.academic_year = data.get('academic_year', note.academic_year)
    # Add any other fields you want to be editable, like description
    # note.description = data.get('description', note.description)

    # 5. Save the changes to the database
    db.session.commit()

    # 6. Create a dictionary of the updated note to send back
    updated_note_data = {
        'id': note.id,
        'title': note.title,
        'description': note.description,
        'file_url': note.file_url,
        'subject': note.subject,
        'semester': note.semester,
        'academic_year': note.academic_year,
        'created_at': note.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        'author_username': note.author.username,
        'user_id': note.user_id
    }

    return jsonify({
        "message": "Note updated successfully",
        "note": updated_note_data
    }), 200


@api.route('/admin/users', methods=['GET'])
@super_admin_required()
def get_all_users():
    # Eagerly load department relationships to prevent performance issues
    users = User.query.options(
        joinedload(User.department), 
        joinedload(User.departments_taught)
    ).all()

    users_list = []
    for user in users:
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role
        }
        
        if user.role == 'student' and user.section:
            user_data['section_id'] = user.section_id
        elif user.role == 'professor':
            user_data['departments_taught'] = [{
                'id': dept.id,
                'name': dept.name,
                'short_name': dept.short_name
            } for dept in user.departments_taught]
            
        users_list.append(user_data)
        
    return jsonify(users_list)

@api.route('/admin/users/<int:user_id>/role', methods=['PUT'])
@super_admin_required()
def update_user_role(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify(error="User not found"), 404
        
    data = request.get_json()
    new_role = data.get('role')
    
    # Simple validation for allowed roles
    if new_role not in ['student', 'moderator', 'professor', 'super_admin']:
        return jsonify(error="Invalid role specified"), 400
    
    if user.role == 'professor' and new_role != 'professor':
        user.departments_taught = []
        
    user.role = new_role
    db.session.commit()
    log_activity('admin_role_change', f"User '{user.username}' role changed to '{new_role}'.")
    return jsonify(message=f"User {user.username}'s role updated to {new_role}")

@api.route('/admin/stats', methods=['GET'])
@super_admin_required()
def get_admin_stats():
    total_users = User.query.count()
    total_notes = Note.query.count()

    # Get the 5 most recent users
    recent_users = User.query.order_by(User.id.desc()).limit(5).all()
    recent_users_list = [{'id': u.id, 'username': u.username, 'email': u.email} for u in recent_users]

    # Get the 5 most recent notes
    recent_notes = Note.query.options(joinedload(Note.author)).order_by(Note.created_at.desc()).limit(5).all()
    recent_notes_list = [{'id': n.id, 'title': n.title, 'author': n.author.username if n.author else 'Unknown'} for n in recent_notes]

    return jsonify({
        'total_users': total_users,
        'total_notes': total_notes,
        'recent_users': recent_users_list,
        'recent_notes': recent_notes_list
    })

@api.route('/admin/logs', methods=['GET'])
@super_admin_required()
def get_activity_logs():

    day_str = request.args.get('day')
    action_filter = request.args.get('action')

    query = Log.query
    
    if day_str:
        try:
            # Filter logs to a specific day
            log_date = date.fromisoformat(day_str)
            query = query.filter(db.func.date(Log.timestamp) == log_date)
        except (ValueError, TypeError):
            return jsonify(error="Invalid date format. Use YYYY-MM-DD."), 400

    if action_filter:
            query = query.filter(Log.action == action_filter)

    logs = query.order_by(Log.timestamp.desc()).all()

    logs_list = []
    for log in logs:
        logs_list.append({
            'id': log.id,
            'timestamp': log.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'username': log.user.username if log.user else 'System',
            'action': log.action,
            'details': log.details
        })
        
    return jsonify(logs_list)

@api.route('/admin/courses', methods=['POST'])
@super_admin_required()
def create_course():
    data = request.get_json()
    if not data or not data.get('name') or not data.get('short_name') or not data.get('duration_years'):
        return jsonify(error="Missing required fields"), 400

    new_course = Course(
        name=data['name'],
        short_name=data['short_name'],
        duration_years=data['duration_years']
    )
    db.session.add(new_course)
    db.session.commit()
    log_activity('course_created', f"Course '{new_course.short_name}' created.")
    return jsonify(message="Course created successfully", id=new_course.id), 201

@api.route('/admin/courses', methods=['GET'])
@super_admin_required()
def get_all_courses():
    courses = Course.query.all()
    courses_list = [{
        'id': c.id,
        'name': c.name,
        'short_name': c.short_name,
        'duration_years': c.duration_years
    } for c in courses]
    return jsonify(courses_list)

@api.route('/admin/courses/<int:course_id>', methods=['PUT'])
@super_admin_required()
def update_course(course_id):
    course = Course.query.get_or_404(course_id)
    data = request.get_json()

    course.name = data.get('name', course.name)
    course.short_name = data.get('short_name', course.short_name)
    course.duration_years = data.get('duration_years', course.duration_years)
    
    db.session.commit()
    log_activity('course_updated', f"Course ID {course_id} updated.")
    return jsonify(message="Course updated successfully")

@api.route('/admin/courses/<int:course_id>', methods=['DELETE'])
@super_admin_required()
def delete_course(course_id):
    course = Course.query.get_or_404(course_id)
    
    if course.departments:
        return jsonify(error="Cannot delete course with associated departments. Please reassign or delete them first."), 409

    db.session.delete(course)
    db.session.commit()
    log_activity('course_deleted', f"Course ID {course_id} ('{course.short_name}') deleted.")
    return jsonify(message="Course deleted successfully")


@api.route('/admin/departments', methods=['POST'])
@super_admin_required()
def create_department():
    data = request.get_json()
    if not data or not data.get('name') or not data.get('short_name') or not data.get('course_id'):
        return jsonify(error="Missing required fields"), 400

    # Check if the course exists
    course = Course.query.get(data['course_id'])
    if not course:
        return jsonify(error="Parent course not found"), 404

    new_department = Department(
        name=data['name'],
        short_name=data['short_name'],
        course_id=data['course_id']
    )
    db.session.add(new_department)
    db.session.commit()
    log_activity('department_created', f"Department '{new_department.short_name}' created.")
    return jsonify(message="Department created successfully", id=new_department.id), 201

@api.route('/admin/departments', methods=['GET'])
@super_admin_required()
def get_all_departments():
    # Use joinedload to efficiently fetch the related course name
    departments = Department.query.options(joinedload(Department.course)).all()
    departments_list = [{
        'id': d.id,
        'name': d.name,
        'short_name': d.short_name,
        'course_id': d.course_id,
        'course_short_name': d.course.short_name if d.course else 'N/A'
    } for d in departments]
    return jsonify(departments_list)

@api.route('/admin/departments/<int:dept_id>', methods=['PUT'])
@super_admin_required()
def update_department(dept_id):
    department = Department.query.get_or_404(dept_id)
    data = request.get_json()

    department.name = data.get('name', department.name)
    department.short_name = data.get('short_name', department.short_name)
    department.course_id = data.get('course_id', department.course_id)
    
    db.session.commit()
    log_activity('department_updated', f"Department ID {dept_id} updated.")
    return jsonify(message="Department updated successfully")

@api.route('/admin/departments/<int:dept_id>', methods=['DELETE'])
@super_admin_required()
def delete_department(dept_id):
    department = Department.query.get_or_404(dept_id)
    
    # Prevent deleting a department if it has students, professors, or notes
    if department.students or department.professors.first() or department.notes:
        return jsonify(error="Cannot delete department with associated users or notes."), 409

    db.session.delete(department)
    db.session.commit()
    log_activity('department_deleted', f"Department ID {dept_id} ('{department.short_name}') deleted.")
    return jsonify(message="Department deleted successfully")

@api.route('/admin/users/<int:user_id>/department', methods=['PUT'])
@super_admin_required()
def assign_student_department(user_id):
    user = User.query.get_or_404(user_id)
    if user.role != 'student':
        return jsonify(error="This user is not a student."), 400

    data = request.get_json()
    department_id = data.get('department_id')

    if department_id:
        department = Department.query.get(department_id)
        if not department:
            return jsonify(error="Department not found."), 404
        user.department_id = department_id
    else:
        # Allow un-assigning a student
        user.department_id = None

    db.session.commit()
    log_activity('student_department_assigned', f"Student '{user.username}' assigned to department ID {department_id}.")
    return jsonify(message="Student department updated successfully.")

@api.route('/admin/professors/<int:user_id>/departments', methods=['PUT'])
@super_admin_required()
def assign_professor_departments(user_id):
    user = User.query.get_or_404(user_id)
    if user.role != 'professor':
        return jsonify(error="This user is not a professor."), 400

    data = request.get_json()
    department_ids = data.get('department_ids', [])

    # Clear existing departments
    user.departments_taught = []

    # Assign new departments
    for dept_id in department_ids:
        department = Department.query.get(dept_id)
        if department:
            user.departments_taught.append(department)

    db.session.commit()
    log_activity('professor_departments_assigned', f"Professor '{user.username}' departments updated.")
    return jsonify(message="Professor departments updated successfully.")

@api.route('/admin/sessions', methods=['POST'])
@super_admin_required()
def create_session():
    data = request.get_json()
    if not data or not data.get('year_name'):
        return jsonify(error="Year name is required"), 400

    # If setting a session to active, ensure no others are active
    if data.get('is_active'):
        AcademicSession.query.update({AcademicSession.is_active: False})

    new_session = AcademicSession(
        year_name=data['year_name'],
        is_active=data.get('is_active', False)
    )
    db.session.add(new_session)
    db.session.commit()
    log_activity('session_created', f"Academic session '{new_session.year_name}' created.")
    return jsonify(message="Academic session created successfully", id=new_session.id), 201

@api.route('/admin/sessions', methods=['GET'])
@super_admin_required()
def get_all_sessions():
    sessions = AcademicSession.query.order_by(AcademicSession.year_name.desc()).all()
    sessions_list = [{
        'id': s.id,
        'year_name': s.year_name,
        'is_active': s.is_active
    } for s in sessions]
    return jsonify(sessions_list)

@api.route('/admin/sessions/<int:session_id>', methods=['PUT'])
@super_admin_required()
def update_session(session_id):
    session = AcademicSession.query.get_or_404(session_id)
    data = request.get_json()

    # If activating this session, deactivate all others first
    if data.get('is_active'):
        AcademicSession.query.filter(AcademicSession.id != session_id).update({AcademicSession.is_active: False})

    session.year_name = data.get('year_name', session.year_name)
    session.is_active = data.get('is_active', session.is_active)
    
    db.session.commit()
    log_activity('session_updated', f"Academic session ID {session_id} updated.")
    return jsonify(message="Academic session updated successfully")

@api.route('/admin/sessions/<int:session_id>', methods=['DELETE'])
@super_admin_required()
def delete_session(session_id):
    session = AcademicSession.query.get_or_404(session_id)
    
    if session.sections:
        return jsonify(error="Cannot delete session with associated sections. Please delete them first."), 409

    db.session.delete(session)
    db.session.commit()
    log_activity('session_deleted', f"Session ID {session_id} ('{session.year_name}') deleted.")
    return jsonify(message="Academic session deleted successfully")

@api.route('/admin/sections', methods=['POST'])
@super_admin_required()
def create_section():
    data = request.get_json()
    required_fields = ['name', 'year', 'department_id', 'academic_session_id']
    if not all(field in data for field in required_fields):
        return jsonify(error="Missing required fields"), 400

    new_section = Section(
        name=data['name'],
        year=data['year'],
        department_id=data['department_id'],
        academic_session_id=data['academic_session_id']
    )
    db.session.add(new_section)
    db.session.commit()
    log_activity('section_created', f"Section '{new_section.section_code}' created.")
    return jsonify(message="Section created successfully", id=new_section.id), 201

@api.route('/admin/sections', methods=['GET'])
@super_admin_required()
def get_all_sections():
    # Eagerly load related data for efficiency
    sections = Section.query.options(
        joinedload(Section.department),
        joinedload(Section.academic_session)
    ).order_by(Section.academic_session_id.desc(), Section.department_id, Section.year, Section.name).all()
    
    sections_list = [{
        'id': s.id,
        'name': s.name,
        'year': s.year,
        'department_id': s.department_id,
        'academic_session_id': s.academic_session_id,
        'section_code': s.section_code,
        'department_name': s.department.name if s.department else 'N/A',
        'session_name': s.academic_session.year_name if s.academic_session else 'N/A'
    } for s in sections]
    return jsonify(sections_list)

@api.route('/admin/sections/<int:section_id>', methods=['PUT'])
@super_admin_required()
def update_section(section_id):
    section = Section.query.get_or_404(section_id)
    data = request.get_json()

    section.name = data.get('name', section.name)
    section.year = data.get('year', section.year)
    section.department_id = data.get('department_id', section.department_id)
    section.academic_session_id = data.get('academic_session_id', section.academic_session_id)
    
    db.session.commit()
    log_activity('section_updated', f"Section ID {section_id} updated.")
    return jsonify(message="Section updated successfully")

@api.route('/admin/sections/<int:section_id>', methods=['DELETE'])
@super_admin_required()
def delete_section(section_id):
    section = Section.query.get_or_404(section_id)
    
    if section.students:
        return jsonify(error="Cannot delete section with assigned students."), 409

    db.session.delete(section)
    db.session.commit()
    log_activity('section_deleted', f"Section ID {section_id} ('{section.section_code}') deleted.")
    return jsonify(message="Section deleted successfully")

@api.route('/admin/students/<int:user_id>/section', methods=['PUT'])
@super_admin_required()
def assign_student_section(user_id):
    user = User.query.get_or_404(user_id)
    if user.role != 'student':
        return jsonify(error="This user is not a student."), 400

    data = request.get_json()
    section_id = data.get('section_id')

    # Allow un-assigning a student by passing a null/empty section_id
    if section_id:
        section = Section.query.get(section_id)
        if not section:
            return jsonify(error="Section not found."), 404
        user.section_id = section_id
        # Automatically update the user's department based on the section
        user.department_id = section.department_id
    else:
        user.section_id = None
        user.department_id = None # Also clear the department if un-assigned

    db.session.commit()
    log_activity('student_section_assigned', f"Student '{user.username}' assigned to section ID {section_id}.")
    return jsonify(message="Student section updated successfully.")