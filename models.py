from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    quizzes = db.relationship('Quiz', backref='creator', lazy=True, cascade='all, delete-orphan')
    attempts = db.relationship('QuizAttempt', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }


class Quiz(db.Model):
    __tablename__ = 'quizzes'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    topic = db.Column(db.String(255), nullable=False)
    source_type = db.Column(db.String(20), nullable=False)  # 'ai_topic' or 'pdf_upload'
    source_file = db.Column(db.String(255), nullable=True)  # File path if uploaded
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    questions = db.relationship('Question', backref='quiz', lazy=True, cascade='all, delete-orphan')
    attempts = db.relationship('QuizAttempt', backref='quiz', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self, include_questions=False):
        data = {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'topic': self.topic,
            'source_type': self.source_type,
            'question_count': len(self.questions),
            'created_at': self.created_at.isoformat()
        }
        if include_questions:
            data['questions'] = [q.to_dict() for q in self.questions]
        return data


class Question(db.Model):
    __tablename__ = 'questions'
    
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id'), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.String(20), nullable=False)  # 'multiple_choice', 'true_false', 'short_answer'
    
    # For multiple choice and true/false
    options = db.Column(db.JSON, nullable=True)  # {'A': 'text', 'B': 'text', ...}
    correct_answer = db.Column(db.String(255), nullable=False)  # 'A', 'B', 'true', 'false', or answer text
    
    order = db.Column(db.Integer, default=0)
    
    # Relationships
    answers = db.relationship('Answer', backref='question', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'question': self.question_text,
            'type': self.question_type,
            'options': self.options,
            'order': self.order
        }
    
    def to_dict_with_answer(self):
        """Return question with correct answer - only for displaying results"""
        return {
            'id': self.id,
            'question': self.question_text,
            'type': self.question_type,
            'options': self.options,
            'correct_answer': self.correct_answer,
            'order': self.order
        }


class QuizAttempt(db.Model):
    __tablename__ = 'quiz_attempts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id'), nullable=False)
    score = db.Column(db.Float, nullable=True)
    total_questions = db.Column(db.Integer, nullable=False)
    correct_answers = db.Column(db.Integer, nullable=False, default=0)
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)
    time_taken_seconds = db.Column(db.Integer, nullable=True)
    is_completed = db.Column(db.Boolean, default=False)
    
    # Relationships
    answers = db.relationship('Answer', backref='attempt', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'quiz_id': self.quiz_id,
            'score': self.score,
            'correct_answers': self.correct_answers,
            'total_questions': self.total_questions,
            'started_at': self.started_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'time_taken_seconds': self.time_taken_seconds,
            'is_completed': self.is_completed
        }


class Answer(db.Model):
    __tablename__ = 'answers'
    
    id = db.Column(db.Integer, primary_key=True)
    attempt_id = db.Column(db.Integer, db.ForeignKey('quiz_attempts.id'), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'), nullable=False)
    user_answer = db.Column(db.String(255), nullable=False)
    is_correct = db.Column(db.Boolean, nullable=False)
    answered_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'question_id': self.question_id,
            'user_answer': self.user_answer,
            'is_correct': self.is_correct,
            'answered_at': self.answered_at.isoformat()
        }
