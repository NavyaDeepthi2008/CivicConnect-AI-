from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from database import db, init_db
from routes.auth import auth_bp
from routes.issues import issues_bp
from routes.admin import admin_bp
from routes.analytics import analytics_bp
from routes.ai_routes import ai_bp
import os

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"], supports_credentials=True)

app.config['SECRET_KEY'] = 'civicconnect-secret-key-2024'
app.config['JWT_SECRET_KEY'] = 'civicconnect-jwt-secret-2024'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///civicconnect.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

db.init_app(app)
jwt = JWTManager(app)

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(issues_bp, url_prefix='/api/issues')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
app.register_blueprint(ai_bp, url_prefix='/api/ai')

with app.app_context():
    init_db()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
