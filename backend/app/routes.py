from flask import request, jsonify, Blueprint
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from functools import wraps
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, create_refresh_token, get_jwt, verify_jwt_in_request
import secrets
from datetime import date, datetime, timedelta
from .email import send_password_reset_email
from .utils import upload_file_to_firebase, delete_file_from_firebase
from .models import User, Note, Log
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
    # 1. Get the data from the incoming request
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Missing email or password"}), 400

    # 2. Check if user already exists
    if User.query.filter_by(email=data.get('email')).first():
        return jsonify({"error": "Email address already in use"}), 409
    
    if User.query.filter_by(username=data.get('username')).first():
        return jsonify({"error": "Username already in use"}), 409
    
    # 3. Hash the password for security
    hashed_password = generate_password_hash(data['password'], method='pbkdf2:sha256')

    # 4. Create a new User object with the data
    new_user = User(
        username=data.get('username'),
        email=data.get('email'),
        password_hash=hashed_password
    )

    # 5. Add the new user to the database
    db.session.add(new_user)
    db.session.commit()
    log_activity('user_signup', f"New user '{new_user.username}' created.")

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
        return jsonify({"error": "An internal server error occurred"}), 500

    except Exception as e:
        db.session.rollback()
        print(f"An error occurred during note deletion: {e}") # Log the error
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
    users = User.query.all()
    users_list = []
    for user in users:
        users_list.append({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role
        })
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
        
    user.role = new_role
    db.session.commit()
    log_activity('admin_role_change', f"User '{user.username}' role changed to '{new_role}'.")
    return jsonify(message=f"User {user.username}'s role updated to {new_role}")

@api.route('/admin/stats', methods=['GET'])
@super_admin_required()
def get_admin_stats():
    total_users = db.session.query(User).count()
    total_notes = db.session.query(Note).count()

    # Get the 5 most recent users
    recent_users = User.query.order_by(User.id.desc()).limit(5).all()
    recent_users_list = [{'id': u.id, 'username': u.username, 'email': u.email} for u in recent_users]

    # Get the 5 most recent notes
    recent_notes = Note.query.order_by(Note.created_at.desc()).limit(5).all()
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