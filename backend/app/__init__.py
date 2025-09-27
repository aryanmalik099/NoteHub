# backend/app/__init__.py

from dotenv import load_dotenv
load_dotenv() # Ensures .env is loaded first

from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os
from datetime import timedelta
import firebase_admin
from firebase_admin import credentials

# 1. Initialize extensions in the global scope
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
cors = CORS()

# 2. Use an "Application Factory" function
def create_app():
    app = Flask(__name__)

    # --- Configuration ---
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=15)
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=30)
    app.config["JWT_TOKEN_LOCATION"] = ["headers"]
    app.config["JWT_COOKIE_CSRF_PROTECT"] = False
    app.config["JWT_CSRF_PROTECTION"] = False
    app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:Pass4%40ryan@localhost/notehub'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # 3. Link extensions to the app instance using .init_app()
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # Configure CORS with specific options
    cors.init_app(app, 
                  resources={r"/api/*": {"origins": "http://localhost:3000"}}, 
                  supports_credentials=True,
                  allow_headers=["Authorization", "Content-Type"])

    # --- Firebase Initialization ---
    cred_path = os.path.join(os.path.dirname(__file__), '..', 'firebase-credentials.json')
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred, {
        'storageBucket': 'notehub-project.firebasestorage.app' 
    })
    
    # --- Register JWT Error Handlers ---
    # These must be inside the factory to be associated with the 'jwt' instance
    @jwt.unauthorized_loader
    def _unauthorized(err_str):
        return (jsonify(error="Missing or invalid Authorization header", msg=err_str), 401)

    @jwt.invalid_token_loader
    def _invalid_token(err_str):
        return (jsonify(error="Invalid token", msg=err_str), 422)

    @jwt.expired_token_loader
    def _expired_token(jwt_header, jwt_payload):
        return (jsonify(error="Token has expired", msg="expired"), 401)

    # --- App Context for Migrations ---
    with app.app_context():
        from . import models  # Import models
        
        from .routes import api # Import and Register Blueprints
        app.register_blueprint(api, url_prefix='/api')

    return app