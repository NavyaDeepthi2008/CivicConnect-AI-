from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from database import db, User
import re

auth_bp = Blueprint('auth', __name__)

def validate_email(email):
    return re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email)

def validate_phone(phone):
    return re.match(r'^\d{10}$', phone.replace(' ', '').replace('-', ''))

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    required = ['full_name', 'email', 'phone', 'password', 'latitude', 'longitude']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    if not validate_email(data['email']):
        return jsonify({'error': 'Invalid email format'}), 400
    if not validate_phone(str(data['phone'])):
        return jsonify({'error': 'Phone must be 10 digits'}), 400
    if len(data['password']) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 409

    user = User(
        full_name=data['full_name'].strip(),
        email=data['email'].lower().strip(),
        phone=data['phone'],
        password_hash=generate_password_hash(data['password']),
        latitude=data['latitude'],
        longitude=data['longitude'],
        area_name=data.get('area_name', ''),
        city=data.get('city', ''),
        state=data.get('state', '')
    )
    db.session.add(user)
    db.session.commit()
    token = create_access_token(identity=str(user.id))
    return jsonify({'message': 'Registration successful', 'token': token, 'user': user.to_dict()}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password required'}), 400

    user = User.query.filter_by(email=data['email'].lower().strip()).first()
    if not user or not check_password_hash(user.password_hash, data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({'message': 'Login successful', 'token': token, 'user': user.to_dict()}), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict()), 200

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    data = request.get_json()
    if data.get('full_name'): user.full_name = data['full_name']
    if data.get('phone'): user.phone = data['phone']
    db.session.commit()
    return jsonify(user.to_dict()), 200
