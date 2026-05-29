from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from models import db
import os

def create_app():
    app = Flask(__name__, static_folder='static', static_url_path='/static')
    app.config.from_object(Config)
    
    # Initialize extensions
    db.init_app(app)
    CORS(app)
    JWTManager(app)
    
    # Create uploads folder if it doesn't exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Register blueprints
    from routes.auth import auth_bp
    from routes.quiz import quiz_bp
    from routes.pdf import pdf_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(quiz_bp, url_prefix='/api/quiz')
    app.register_blueprint(pdf_bp, url_prefix='/api/pdf')
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health():
        return {'status': 'ok'}, 200
    
    # Serve frontend pages
    @app.route('/')
    def index():
        return send_from_directory('static', 'index.html')
    
    @app.route('/dashboard.html')
    def dashboard():
        return send_from_directory('static', 'dashboard.html')
    
    @app.route('/quiz.html')
    def quiz():
        return send_from_directory('static', 'quiz.html')
    
    @app.route('/results.html')
    def results():
        return send_from_directory('static', 'results.html')
    
    @app.route('/manifest.json')
    def manifest():
        return send_from_directory('static', 'manifest.json')
    
    @app.route('/service-worker.js')
    def service_worker():
        return send_from_directory('static', 'service-worker.js')
    
    # Serve uploads
    @app.route('/uploads/<filename>')
    def download_file(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    
    @app.errorhandler(404)
    def not_found(error):
        # Try to serve static files for SPA routing
        if error.code == 404:
            return send_from_directory('static', 'index.html')
        return {'error': 'Not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return {'error': 'Internal server error'}, 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)
