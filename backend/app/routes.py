from flask import request, jsonify, Blueprint
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, create_refresh_token
from .utils import upload_file_to_firebase, delete_file_from_firebase
from .models import User, Note
from . import db

# Create a Blueprint
api = Blueprint('api', __name__)

# Define the allowed file extensions
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}

# Helper function to check if the file extension is allowed
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

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
    return jsonify(access_token=access_token, refresh_token=refresh_token), 200


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
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid user identity in token"}), 401

    # 1. Get the file and form data from the request
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    # Check if the file has an allowed extension
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
        user_id=current_user_id
    )
    db.session.add(new_note)
    db.session.commit()

    return jsonify({"message": "Note uploaded successfully!", "file_url": file_url}), 201


@api.route('/notes', methods=['GET'])
def get_notes():
    # 1. Get page number from query args, default to page 1
    page = request.args.get('page', 1, type=int)
    # Define how many notes to show per page
    per_page = 9 

    # Get search filters from query args
    subject = request.args.get('subject')
    academic_year = request.args.get('academic_year')
    title = request.args.get('title')

    query = Note.query

    # Apply filters
    if title:
        query = query.filter(Note.title.ilike(f'%{title}%'))
    if subject:
        query = query.filter(Note.subject.ilike(f'%{subject}%'))
    if academic_year:
        query = query.filter(Note.academic_year.ilike(f'%{academic_year}%'))
    
    # 2. Use .paginate() instead of .all()
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
            'user_id': note.user_id
        }
        notes_list.append(note_data)
        
    # 3. Return the notes list AND pagination metadata
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

# This route will get only the notes for the logged-in user
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
    if note.user_id != current_user.id and current_user.role != 'moderator':
        return jsonify({"error": "Forbidden: You do not have permission to delete this note"}), 403

    # The rest of the delete logic remains the same
    try:
        delete_file_from_firebase(note.file_url)
        db.session.delete(note)
        db.session.commit()
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
