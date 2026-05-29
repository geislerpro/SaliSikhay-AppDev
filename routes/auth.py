from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Validate input
        if not data or not data.get('username') or not data.get('email') or not data.get('password'):
            return {'error': 'Missing required fields'}, 400
        
        username = data.get('username').strip()
        email = data.get('email').strip()
        password = data.get('password')
        
        # Validate password length
        if len(password) < 8:
            return {'error': 'Password must be at least 8 characters long'}, 400
        
        # Check if user already exists
        if User.query.filter_by(username=username).first():
            return {'error': 'Username already exists'}, 409
        
        if User.query.filter_by(email=email).first():
            return {'error': 'Email already registered'}, 409
        
        # Create new user
        hashed_password = generate_password_hash(password)
        user = User(username=username, email=email, password=hashed_password)
        
        db.session.add(user)
        db.session.commit()
        
        # Generate token (convert user.id to string for JWT)
        access_token = create_access_token(identity=str(user.id))
        
        return {
            'message': 'Registration successful',
            'user': user.to_dict(),
            'access_token': access_token
        }, 201
    
    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()
        
        if not data or not data.get('username') or not data.get('password'):
            return {'error': 'Missing username or password'}, 400
        
        username = data.get('username').strip()
        password = data.get('password')
        
        # Find user
        user = User.query.filter_by(username=username).first()
        
        if not user or not check_password_hash(user.password, password):
            return {'error': 'Invalid username or password'}, 401
        
        # Generate token (convert user.id to string for JWT)
        access_token = create_access_token(identity=str(user.id))
        
        return {
            'message': 'Login successful',
            'user': user.to_dict(),
            'access_token': access_token
        }, 200
    
    except Exception as e:
        return {'error': str(e)}, 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current logged-in user"""
    try:
        user_id = int(get_jwt_identity())  # Convert string back to int
        user = User.query.get(user_id)
        
        if not user:
            return {'error': 'User not found'}, 404
        
        return {'user': user.to_dict()}, 200
    
    except Exception as e:
        return {'error': str(e)}, 500
