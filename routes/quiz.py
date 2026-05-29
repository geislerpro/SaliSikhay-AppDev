from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Quiz, Question, QuizAttempt, Answer, User
from services.ai_service import generate_quiz_from_topic
from datetime import datetime

quiz_bp = Blueprint('quiz', __name__)

@quiz_bp.route('/list', methods=['GET'])
@jwt_required()
def list_quizzes():
    """Get all quizzes for current user"""
    try:
        user_id = int(get_jwt_identity())  # Convert string back to int
        quizzes = Quiz.query.filter_by(user_id=user_id).order_by(Quiz.created_at.desc()).all()
        
        return {
            'quizzes': [q.to_dict() for q in quizzes],
            'total': len(quizzes)
        }, 200
    
    except Exception as e:
        return {'error': str(e)}, 500


@quiz_bp.route('/create-from-topic', methods=['POST'])
@jwt_required()
def create_from_topic():
    """Create quiz from AI-generated content based on topic"""
    try:
        user_id = int(get_jwt_identity())  # Convert string back to int
        print(f"✅ Received request to create quiz from topic. User ID: {user_id}")
        
        data = request.get_json()
        print(f"📥 Request data: {data}")
        
        if not data or not data.get('topic'):
            print("❌ No topic provided")
            return {'error': 'Topic is required'}, 400
        
        topic = data.get('topic').strip()
        num_questions = data.get('num_questions', 5)
        
        print(f"🧠 Generating quiz for topic: {topic} with {num_questions} questions")
        
        # Generate quiz content from AI
        quiz_content = generate_quiz_from_topic(topic, num_questions)
        
        print(f"📝 Quiz content generated: {type(quiz_content)}")
        
        if not quiz_content:
            print("❌ Failed to generate quiz content")
            return {'error': 'Failed to generate quiz'}, 500
        
        # Create quiz in database
        quiz = Quiz(
            user_id=user_id,
            title=quiz_content.get('title', topic),
            description=quiz_content.get('description', ''),
            topic=topic,
            source_type='ai_topic'
        )
        
        db.session.add(quiz)
        db.session.flush()  # Get quiz ID without committing
        
        print(f"💾 Quiz created with ID: {quiz.id}")
        
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
        
        print(f"✅ Quiz {quiz.id} successfully created with {len(quiz_content.get('questions', []))} questions")
        
        return {
            'message': 'Quiz created successfully',
            'quiz': quiz.to_dict(include_questions=True)
        }, 201
    
    except Exception as e:
        print(f"❌ Error creating quiz: {str(e)}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return {'error': str(e)}, 500


@quiz_bp.route('/<int:quiz_id>', methods=['GET'])
@jwt_required()
def get_quiz(quiz_id):
    """Get quiz details with questions"""
    try:
        user_id = int(get_jwt_identity())  # Convert string back to int
        quiz = Quiz.query.filter_by(id=quiz_id, user_id=user_id).first()
        
        if not quiz:
            return {'error': 'Quiz not found'}, 404
        
        questions = []
        for q in quiz.questions:
            q_dict = q.to_dict()
            # Don't send correct answer to frontend (for cheating prevention)
            if 'correct_answer' in q_dict:
                del q_dict['correct_answer']
            questions.append(q_dict)
        
        quiz_data = quiz.to_dict()
        quiz_data['questions'] = questions
        
        return {'quiz': quiz_data}, 200
    
    except Exception as e:
        return {'error': str(e)}, 500


@quiz_bp.route('/<int:quiz_id>', methods=['DELETE'])
@jwt_required()
def delete_quiz(quiz_id):
    """Delete a quiz"""
    try:
        user_id = int(get_jwt_identity())  # Convert string back to int
        quiz = Quiz.query.filter_by(id=quiz_id, user_id=user_id).first()
        
        if not quiz:
            return {'error': 'Quiz not found'}, 404
        
        db.session.delete(quiz)
        db.session.commit()
        
        return {'message': 'Quiz deleted successfully'}, 200
    
    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 500


@quiz_bp.route('/attempt/start/<int:quiz_id>', methods=['POST'])
@jwt_required()
def start_attempt(quiz_id):
    """Start a quiz attempt"""
    try:
        user_id = int(get_jwt_identity())  # Convert string back to int
        quiz = Quiz.query.filter_by(id=quiz_id, user_id=user_id).first()
        
        if not quiz:
            return {'error': 'Quiz not found'}, 404
        
        attempt = QuizAttempt(
            user_id=user_id,
            quiz_id=quiz_id,
            total_questions=len(quiz.questions)
        )
        
        db.session.add(attempt)
        db.session.commit()
        
        return {
            'message': 'Quiz attempt started',
            'attempt': attempt.to_dict()
        }, 201
    
    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 500


@quiz_bp.route('/attempt/<int:attempt_id>/submit', methods=['POST'])
@jwt_required()
def submit_answers(attempt_id):
    """Submit answers for a quiz attempt"""
    try:
        user_id = int(get_jwt_identity())  # Convert string back to int
        data = request.get_json()
        answers_data = data.get('answers', [])
        
        attempt = QuizAttempt.query.filter_by(id=attempt_id, user_id=user_id).first()
        
        if not attempt:
            return {'error': 'Attempt not found'}, 404
        
        if attempt.is_completed:
            return {'error': 'This attempt is already completed'}, 400
        
        correct_count = 0
        
        # Process each answer
        for answer_data in answers_data:
            question_id = answer_data.get('question_id')
            user_answer = answer_data.get('answer')
            
            question = Question.query.get(question_id)
            if not question:
                continue
            
            # Check if answer is correct
            is_correct = user_answer == question.correct_answer
            if is_correct:
                correct_count += 1
            
            # Save answer
            answer = Answer(
                attempt_id=attempt_id,
                question_id=question_id,
                user_answer=user_answer,
                is_correct=is_correct
            )
            db.session.add(answer)
        
        # Update attempt
        attempt.correct_answers = correct_count
        attempt.score = (correct_count / attempt.total_questions) * 100
        attempt.is_completed = True
        attempt.completed_at = datetime.utcnow()
        
        db.session.commit()
        
        return {
            'message': 'Quiz submitted successfully',
            'attempt': attempt.to_dict()
        }, 200
    
    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 500


@quiz_bp.route('/attempts', methods=['GET'])
@jwt_required()
def get_user_attempts():
    """Get all quiz attempts for current user"""
    try:
        user_id = int(get_jwt_identity())  # Convert string back to int
        attempts = QuizAttempt.query.filter_by(user_id=user_id).order_by(
            QuizAttempt.started_at.desc()
        ).all()
        
        return {
            'attempts': [a.to_dict() for a in attempts],
            'total': len(attempts)
        }, 200
    
    except Exception as e:
        return {'error': str(e)}, 500


@quiz_bp.route('/attempt/<int:attempt_id>', methods=['GET'])
@jwt_required()
def get_attempt_details(attempt_id):
    """Get detailed attempt results"""
    try:
        user_id = int(get_jwt_identity())  # Convert string back to int
        attempt = QuizAttempt.query.filter_by(id=attempt_id, user_id=user_id).first()
        
        if not attempt:
            return {'error': 'Attempt not found'}, 404
        
        attempt_data = attempt.to_dict()
        attempt_data['answers'] = [a.to_dict() for a in attempt.answers]
        
        # Include questions with correct answers (for results display only)
        quiz = Quiz.query.get(attempt.quiz_id)
        if quiz:
            attempt_data['questions'] = [q.to_dict_with_answer() for q in quiz.questions]
        
        return {'attempt': attempt_data}, 200
    
    except Exception as e:
        return {'error': str(e)}, 500
