from . import db
from datetime import datetime

note_sections = db.Table('note_sections',
    db.Column('note_id', db.Integer, db.ForeignKey('notes.id'), primary_key=True),
    db.Column('section_id', db.Integer, db.ForeignKey('sections.id'), primary_key=True)
)

professor_departments = db.Table('professor_departments',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('department_id', db.Integer, db.ForeignKey('departments.id'), primary_key=True)
)

class Course(db.Model):
    __tablename__ = 'courses'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False) # e.g., Bachelor of Technology
    short_name = db.Column(db.String(20), unique=True, nullable=False) # e.g., B.Tech
    duration_years = db.Column(db.Integer, nullable=False) # e.g., 4

    departments = db.relationship('Department', backref='course', lazy=True)

    def __repr__(self):
        return f'<Course {self.short_name}>'

class Department(db.Model):
    __tablename__ = 'departments'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False) # e.g., Computer Science and Engineering
    short_name = db.Column(db.String(20), nullable=False) # e.g., CSE
    
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)

    def __repr__(self):
        return f'<Department {self.short_name}>'
    
class AcademicSession(db.Model):
    __tablename__ = 'academic_sessions'
    id = db.Column(db.Integer, primary_key=True)
    year_name = db.Column(db.String(50), unique=True, nullable=False) # e.g., "2025-2026"
    is_active = db.Column(db.Boolean, default=False, nullable=False)
    
    sections = db.relationship('Section', backref='academic_session', lazy=True)
    def __repr__(self): return f'<AcademicSession {self.year_name}>'

class Section(db.Model):
    __tablename__ = 'sections'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False) # e.g., "1", "2", "A"
    year = db.Column(db.Integer, nullable=False) # e.g., 1, 2, 3, 4
    
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False)
    department = db.relationship('Department', backref='sections', lazy=True)
    
    academic_session_id = db.Column(db.Integer, db.ForeignKey('academic_sessions.id'), nullable=False)

    @property
    def section_code(self):
        return f"{self.year}{self.department.short_name}{self.name}"
        
    def __repr__(self): return f'<Section {self.section_code}>'

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    college_id = db.Column(db.String(20), unique=True, nullable=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='student')
    
    admission_year = db.Column(db.Integer, nullable=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=True)
    department = db.relationship('Department', backref='students', lazy=True)
    section_id = db.Column(db.Integer, db.ForeignKey('sections.id'), nullable=True)
    section = db.relationship('Section', backref='students', lazy=True)

    departments_taught = db.relationship('Department', secondary=professor_departments,
                                         backref=db.backref('professors', lazy='dynamic'))

    notes = db.relationship('Note', backref='author', lazy=True)
    logs = db.relationship('Log', backref='user', lazy=True)

    def __repr__(self):
        return f'<User {self.username}>'

class Note(db.Model):
    __tablename__ = 'notes'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    file_url = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    subject = db.Column(db.String(100), nullable=False)
    semester = db.Column(db.Integer, nullable=False)
    academic_year = db.Column(db.String(100), nullable=False)
    
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=True)
    department = db.relationship('Department', backref='notes', lazy=True)
    sections = db.relationship('Section', secondary=note_sections, backref=db.backref('notes', lazy='dynamic'))

    def __repr__(self):
        return f'<Note {self.title}>'

class Log(db.Model):
    __tablename__ = 'logs'
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    action = db.Column(db.String(100), nullable=False)
    details = db.Column(db.String(255), nullable=True)

    def __repr__(self):
        return f'<Log {self.action}>'