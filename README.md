# NoteHub

A full‑stack platform for managing and sharing academic notes within a college ecosystem. NoteHub supports role-based access (student, moderator, professor, super_admin), secure authentication using JWT (access + refresh), file uploads to Firebase Storage, robust admin tooling for courses/departments/sections/sessions, and an activity log for visibility.


## Table of Contents
- Overview
- Features
- Architecture
- Tech Stack
- Getting Started
  - Prerequisites
  - Project Structure
  - Environment Variables
  - Backend Setup (Flask)
  - Frontend Setup (React)
- Running the App (Dev)
- Migrations and Database
- API Overview
- Roles and Permissions
- Notes Storage
- Testing
- Deployment
- Troubleshooting
- Contributing
- License


## Overview
NoteHub enables students and faculty to upload, discover, and manage study notes.
- Secure signup restricted to institutional emails (e.g., @imsec.ac.in)
- Automatic derivation of College ID and metadata
- Fine-grained roles and permissions
- Search and filter notes with pagination
- Admin console for courses, departments, academic sessions, and sections
- Firebase-backed file storage
- Activity logging for key user and admin actions


## Features
- Auth
  - JWT access and refresh tokens
  - Password reset via email token
  - Change password flow
- Notes
  - Upload PDF/PNG/JPG with metadata (subject, semester, academic year)
  - List, filter (title/subject/year), paginate
  - Edit and delete (author or privileged role)
  - Optional “verified” flag when uploaded by professors
- Admin
  - Manage courses, departments, academic sessions, sections
  - Assign students to sections and departments
  - Assign professor-to-departments
  - View system stats and activity logs
- Observability
  - Activity log for signup, login, uploads, CRUD operations
- Security & CORS
  - Role-based route protection
  - Configurable frontend origin


## Architecture
Monorepo with separate backend (Flask) and frontend (React). The backend exposes a REST API under /api and integrates with SQLAlchemy, Flask-Migrate (Alembic), JWT, and Firebase Storage.

- Root
  - backend: Flask app factory, SQLAlchemy models, routes, migrations
  - frontend: CRA React application (React 19 + Mantine UI)

High-level flow
1) Frontend authenticates via /api/login and stores tokens (access + refresh)
2) Axios interceptors attach Authorization headers and silently refresh access tokens when expired
3) Backend validates JWTs, applies role checks, performs DB operations, and stores/retrieves files in Firebase Storage


## Tech Stack
- Backend
  - Python 3.x, Flask 3.x, Flask-JWT-Extended, Flask-SQLAlchemy, Flask-Migrate
  - Alembic migrations
  - MySQL (default) or PostgreSQL (supported via DATABASE_URL)
  - Email (password reset)
  - Firebase Admin SDK (Storage)
- Frontend
  - React 19 (CRA), React Router, Axios, Mantine UI, React Toastify
- Infrastructure & Config
  - .env configuration, CORS, JWT

Key Python packages (excerpt): Flask, Flask-JWT-Extended, Flask-SQLAlchemy, Flask-Migrate, SQLAlchemy, PyMySQL, psycopg2-binary, firebase_admin, boto3, httpx, Alembic.


## Getting Started

### Prerequisites
- Python 3.10+ recommended
- Node.js 18+ and npm
- A running MySQL or PostgreSQL instance
- Firebase service account credentials


### Project Structure
````markdown
```
NoteHub/
├─ backend/
│  ├─ app/
│  │  ├─ __init__.py        # App factory, config, CORS, JWT, Firebase init
│  │  ├─ models.py          # SQLAlchemy models (User, Note, Course, Department, Session, Section, Log)
│  │  ├─ routes.py          # All REST endpoints under /api
│  │  ├─ utils.py, email.py, logger.py
│  ├─ migrations/           # Alembic migration scripts
│  ├─ requirements.txt
│  ├─ run.py                # Dev server entrypoint
│  └─ firebase-credentials.json (optional local fallback)
└─ frontend/
   ├─ src/                  # React app (components, api.js interceptor)
   ├─ public/
   ├─ package.json
   └─ README.md (CRA default)
```
````


### Environment Variables
Backend (.env in backend/ or system envs)
- JWT_SECRET_KEY = {{JWT_SECRET_KEY}}
- DATABASE_URL = {{DATABASE_URL}}
  - Examples:
    - mysql+pymysql://user:{{DB_PASSWORD}}@localhost/notehub
    - postgresql://user:{{DB_PASSWORD}}@localhost/notehub
  - Note: postgres:// is auto-normalized to postgresql://
- CORS_ORIGIN = http://localhost:3000
- FIREBASE_CREDENTIALS_JSON = {{FIREBASE_SERVICE_ACCOUNT_JSON}} (JSON string)
  - Alternatively, place backend/firebase-credentials.json for local dev

Frontend (.env in frontend/)
- REACT_APP_API_URL = http://127.0.0.1:5000/api


### Backend Setup (Flask)
From the backend directory:
````bash
# PowerShell (Windows)
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Set env vars for local dev
$env:FLASK_ENV = "development"
$env:JWT_SECRET_KEY = "{{JWT_SECRET_KEY}}"
$env:DATABASE_URL  = "{{DATABASE_URL}}"
$env:CORS_ORIGIN   = "http://localhost:3000"
# Option A: Use JSON env var
$env:FIREBASE_CREDENTIALS_JSON = "{{FIREBASE_SERVICE_ACCOUNT_JSON}}"
# Option B: Drop file at backend\firebase-credentials.json

# Initialize/upgrade DB
$env:FLASK_APP = "app:create_app"
flask db upgrade

# Run the API (dev)
python .\run.py  # serves at http://127.0.0.1:5000
```
````

Linux/macOS:
````bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export FLASK_APP=app:create_app
flask db upgrade
python run.py
```
````


### Frontend Setup (React)
From the frontend directory:
````bash
# Install deps
npm install

# Start dev server (http://localhost:3000)
npm start
```
````


## Running the App (Dev)
- Backend at http://127.0.0.1:5000
- Frontend at http://localhost:3000
- Ensure CORS_ORIGIN matches the frontend URL
- Ensure REACT_APP_API_URL points to your backend /api base


## Migrations and Database
- ORM: SQLAlchemy
- Migrations: Flask-Migrate (Alembic)
- Models include: User, Note, Course, Department, AcademicSession, Section, Log
- Association table for professor-to-departments

Common commands (from backend/):
````bash
# Make a new migration (after changing models)
$env:FLASK_APP = "app:create_app"
flask db migrate -m "Your message"

# Apply migrations
flask db upgrade

# Rollback
flask db downgrade -1
```
````


## API Overview (selected)
Base URL: /api

Auth
- POST /signup
- POST /login -> returns { access_token, refresh_token }
- POST /refresh (requires refresh token in Authorization header)
- POST /profile/change-password (auth)
- GET  /profile (auth)
- POST /forgot-password
- POST /reset-password/:token

Notes
- GET    /notes?title=&subject=&academic_year=&verified=true|false&page=1
- POST   /notes/upload (auth, multipart: file + title + subject + semester + academic_year)
- PUT    /notes/:id (auth, author only)
- DELETE /notes/:id (auth, author, moderator, or super_admin)

Admin (super_admin only)
- Users:    GET /admin/users, PUT /admin/users/:id/role
- Stats:    GET /admin/stats
- Logs:     GET /admin/logs?day=YYYY-MM-DD&action=...
- Courses:  POST/GET/PUT/DELETE /admin/courses[/:id]
- Departments: POST/GET/PUT/DELETE /admin/departments[/:id]
- Sessions: POST/GET/PUT/DELETE /admin/sessions[/:id]
- Sections: POST/GET/PUT/DELETE /admin/sections[/:id]
- Assignments: PUT /admin/students/:id/section, PUT /admin/users/:id/department, PUT /admin/professors/:id/departments

Axios Client Behavior (frontend/src/api.js)
- Adds Authorization: Bearer <access> to all requests when available
- On 401 (except /login), attempts silent refresh via /refresh with refresh token
- On refresh failure, clears tokens and redirects to /login


## Roles and Permissions
- student: default, can upload/manage own notes
- moderator: can delete notes not authored by them
- professor: uploads are auto-verified; can teach multiple departments
- super_admin: full administrative access to admin endpoints


## Notes Storage
- Allowed uploads: pdf, png, jpg, jpeg
- Stored in Firebase Storage (configured via service account)
- Deletions also remove the file from storage


## Testing
Frontend (from frontend/):
````bash
npm test
```
````

Backend: add tests (pytest/unittest) as needed; a test suite is not yet included.


## Deployment
- Backend
  - Provide DATABASE_URL, JWT_SECRET_KEY, CORS_ORIGIN, FIREBASE_CREDENTIALS_JSON
  - For PostgreSQL providers that emit postgres:// URLs, the app normalizes to postgresql:// automatically
  - Use production WSGI server (e.g., gunicorn) behind a reverse proxy
- Frontend
  - npm run build then serve build/ (Netlify, Vercel, or any static host)


## Troubleshooting
- 401 errors on API calls
  - Ensure access token is present and not expired
  - Confirm refresh token flow; frontend handles this automatically except for /login
- CORS errors
  - Set CORS_ORIGIN to your exact frontend origin
- DB connection errors
  - Verify DATABASE_URL syntax and driver package (PyMySQL for MySQL, psycopg2-binary for Postgres)
- Firebase credential issues
  - Ensure FIREBASE_CREDENTIALS_JSON is set or firebase-credentials.json exists at backend/firebase-credentials.json


## Contributing
- Create a feature branch
- Ensure database migrations are generated for model changes
- Open a PR with a clear description and testing steps


## License
Add a LICENSE file here and reference it, e.g., MIT, Apache-2.0, etc.
