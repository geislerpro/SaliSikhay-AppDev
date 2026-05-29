from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Quiz, Question
from services.pdf_service import extract_text_from_pdf
from services.ai_service import generate_quiz_from_text
from werkzeug.utils import secure_filename
import os

pdf_bp = Blueprint('pdf', __name__)

ALLOWED_EXTENSIONS = {'pdf', 'txt'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@pdf_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_pdf():
    """Upload PDF and generate quiz"""
    try:
        user_id = int(get_jwt_identity())  # Convert string back to int
        
        # Check if file was provided
        if 'file' not in request.files:
            return {'error': 'No file provided'}, 400
        
        file = request.files['file']
        
        if file.filename == '':
            return {'error': 'No file selected'}, 400
        
        if not allowed_file(file.filename):
            return {'error': 'Only PDF and TXT files are allowed'}, 400
        
        # Save file
        filename = secure_filename(file.filename)
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Extract text from file
        if filename.endswith('.pdf'):
            text_content = extract_text_from_pdf(filepath)
        else:  # .txt file
            with open(filepath, 'r', encoding='utf-8') as f:
                text_content = f.read()
        
        if not text_content:
            os.remove(filepath)
            return {'error': 'Could not extract text from file'}, 400
        
        # Get number of questions from request
        num_questions = request.form.get('num_questions', 5)
        try:
            num_questions = int(num_questions)
        except:
            num_questions = 5
        
        # Generate quiz from extracted text
        quiz_content = generate_quiz_from_text(text_content, num_questions)
        
        if not quiz_content:
            os.remove(filepath)
            return {'error': 'Failed to generate quiz from document'}, 500
        
        # Create quiz in database
        quiz = Quiz(
            user_id=user_id,
            title=quiz_content.get('title', os.path.splitext(filename)[0]),
            description=quiz_content.get('description', ''),
            topic=file.filename,
            source_type='pdf_upload',
            source_file=filename
        )
        
        db.session.add(quiz)
        db.session.flush()
        
        # Add questions
        for idx, q_data in enumerate(quiz_content.get('questions', [])):
            question = Question(
                quiz_id=quiz.id,
                question_text=q_data.get('question'),
                question_type=q_data.get('type', 'multiple_choice'),
                options=q_data.get('options'),
                correct_answer=q_data.get('correct_answer'),
                order=idx
            )
            db.session.add(question)
        
        db.session.commit()
        
        return {
            'message': 'PDF processed successfully',
            'quiz': quiz.to_dict(include_questions=True)
        }, 201
    
    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 500


@pdf_bp.route('/download/<filename>', methods=['GET'])
@jwt_required()
def download_original(filename):
    """Download original uploaded file"""
    try:
        user_id = int(get_jwt_identity())  # Convert string back to int
        
        # Verify user owns this file by checking the quiz
        quiz = Quiz.query.filter_by(
            user_id=user_id,
            source_file=filename
        ).first()
        
        if not quiz:
            return {'error': 'File not found'}, 404
        
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        
        if not os.path.exists(filepath):
            return {'error': 'File not available'}, 404
        
        return jsonify({'url': f'/uploads/{filename}'}), 200
    
    except Exception as e:
        return {'error': str(e)}, 500
