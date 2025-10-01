from . import db
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='student')
    moderated_department_id = db.Column(db.Integer, nullable=True)
    reset_token = db.Column(db.String(100), nullable=True)
    reset_token_expiration = db.Column(db.DateTime, nullable=True)

    notes = db.relationship('Note', backref='author', lazy=True)

    def __repr__(self):
        return f'<User {self.username}>'
    

class Note(db.Model):
    __tablename__ = 'notes'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    file_url = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # --- New Columns for Categorization ---
    subject = db.Column(db.String(100), nullable=False)
    professor = db.Column(db.String(100), nullable=True)
    semester = db.Column(db.Integer, nullable=False)
    academic_year = db.Column(db.String(100), nullable=False)
    
    # Foreign key to link to a user
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    def __repr__(self):
        return f'<Note {self.title}>'