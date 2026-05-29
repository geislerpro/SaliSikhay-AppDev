# SaliSikhayAI - AI-Powered Quiz Generation Platform

A modern, full-stack web application for instantly creating interactive quizzes using AI or by uploading documents. Features real-time quiz generation, PDF processing, user authentication, and comprehensive analytics.

## 🌟 Features

- **AI-Powered Quiz Generation**: Generate quizzes from any topic in seconds using OpenAI
- **PDF Upload & Processing**: Upload PDF/TXT files and automatically extract content for quiz creation
- **User Authentication**: Secure JWT-based authentication system
- **Progressive Web App (PWA)**: Install on mobile devices and work offline
- **PostgreSQL Database**: Robust data persistence with relational models
- **Real-time Analytics**: Track quiz attempts, scores, and progress
- **Mobile-Friendly**: Responsive design that works seamlessly on all devices
- **Quiz Review**: Detailed results with answer review and performance metrics

## 🛠️ Tech Stack

### Backend
- **Framework**: Flask 3.0
- **Database**: PostgreSQL
- **Authentication**: Flask-JWT-Extended
- **PDF Processing**: PyPDF2
- **AI Integration**: OpenAI API
- **ORM**: SQLAlchemy

### Frontend
- **HTML5/CSS3/JavaScript (ES6+)**
- **PWA with Service Workers**
- **Responsive Design**
- **Offline Support**

## 📋 Prerequisites

- Python 3.8+
- PostgreSQL 12+
- pip (Python package manager)
- Node.js (optional, for development tools)

## 🚀 Installation & Setup

### 1. Clone & Navigate to Project

```bash
cd c:\Users\Administrator\Documents\appdev_finals
```

### 2. Set Up Python Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your settings
# Update DATABASE_URL, JWT_SECRET_KEY, and GOOGLE_API_KEY
```

### 5. Set Up PostgreSQL Database

```bash
# Create database
createdb salisikhay

# Optional: Create dedicated user
createuser -P salisikhay_user
# Grant privileges
psql -c "GRANT ALL PRIVILEGES ON DATABASE salisikhay TO salisikhay_user;"

# Update DATABASE_URL in .env:
# DATABASE_URL=postgresql://salisikhay_user:password@localhost:5432/salisikhay
```

### 6. Initialize Database Tables

```bash
# The Flask app will automatically create tables on first run
# Or manually run:
python
>>> from app import create_app
>>> from models import db
>>> app = create_app()
>>> with app.app_context():
>>>     db.create_all()
```

### 7. Run the Application

```bash
python app.py
```

The application will start at `http://localhost:5000`

## 📱 Using the Application

### First Time Setup

1. **Register**: Create a new account with username, email, and password
2. **Login**: Log in with your credentials
3. **Dashboard**: Access your quiz dashboard

### Creating Quizzes

#### Method 1: AI Topic Generation
1. Enter a topic in the AI Topic Generator box
2. Select number of questions (5-20)
3. Click "Generate with AI" button
4. Quiz will be created in seconds

#### Method 2: PDF Upload
1. Click on the upload area or drag & drop a PDF/TXT file
2. Select number of questions
3. File will be processed and quiz created automatically

### Taking a Quiz

1. Click "Start Quiz" on any quiz card
2. Answer questions using the options provided
3. Use the question navigator on the right to jump between questions
4. Click "Submit" on the last question to finish
5. View detailed results with performance metrics

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (JWT required)

### Quiz Management
- `GET /api/quiz/list` - Get all user quizzes
- `POST /api/quiz/create-from-topic` - Generate quiz from topic
- `GET /api/quiz/<quiz_id>` - Get quiz details
- `DELETE /api/quiz/<quiz_id>` - Delete quiz

### Quiz Attempts
- `POST /api/quiz/attempt/start/<quiz_id>` - Start quiz attempt
- `POST /api/quiz/attempt/<attempt_id>/submit` - Submit answers
- `GET /api/quiz/attempts` - Get user's attempts
- `GET /api/quiz/attempt/<attempt_id>` - Get attempt details

### PDF Processing
- `POST /api/pdf/upload` - Upload and process PDF file

## 🌐 PWA Installation

The app is a Progressive Web App (PWA) and can be installed on devices:

### On Mobile (Chrome, Firefox)
1. Visit the application in your browser
2. Tap the menu (three dots)
3. Select "Install app" or "Add to Home Screen"

### On Desktop (Chrome, Edge)
1. Visit the application
2. Look for install button in address bar
3. Click to install as app

## 📊 Database Models

### User
- `id`: Primary key
- `username`: Unique username
- `email`: Unique email
- `password`: Hashed password
- `created_at`: Registration timestamp

### Quiz
- `id`: Primary key
- `user_id`: Foreign key to User
- `title`: Quiz title
- `description`: Quiz description
- `topic`: Topic name
- `source_type`: 'ai_topic' or 'pdf_upload'
- `source_file`: Filename if uploaded
- `created_at`: Creation timestamp

### Question
- `id`: Primary key
- `quiz_id`: Foreign key to Quiz
- `question_text`: Question content
- `question_type`: 'multiple_choice' or 'true_false'
- `options`: JSON array of options
- `correct_answer`: Correct answer value
- `order`: Question sequence

### QuizAttempt
- `id`: Primary key
- `user_id`: Foreign key to User
- `quiz_id`: Foreign key to Quiz
- `score`: Percentage score
- `correct_answers`: Count of correct answers
- `total_questions`: Total questions in quiz
- `completed_at`: Completion timestamp
- `is_completed`: Boolean flag

## 🔧 Configuration Options

### Flask Config (config.py)
- `DEBUG`: Enable/disable debug mode
- `SQLALCHEMY_DATABASE_URI`: Database connection string
- `MAX_CONTENT_LENGTH`: Max file upload size (default: 50MB)
- `UPLOAD_FOLDER`: Directory for uploaded files
- `JWT_SECRET_KEY`: JWT signing key

## 📦 Deployment

### Using Waitress (Production WSGI)
```bash
pip install waitress
waitress-serve --port=5000 app:create_app()
```

### Using Gunicorn
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:create_app()
```

### Docker Deployment
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:create_app()"]
```

## Troubleshooting

### Database Connection Error
- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in .env
- Ensure database exists: `psql -l`

### OpenAI API Error
- Verify OPENAI_API_KEY is set correctly
- Check API usage and limits in OpenAI dashboard
- App uses mock quiz generation as fallback

### File Upload Fails
- Check file size (max 50MB)
- Ensure file type is .pdf or .txt
- Verify uploads folder has write permissions

### Service Worker Issues
- Clear browser cache and service worker
- Check browser console for errors
- Verify manifest.json is accessible

## Support & Contributions

For issues, feature requests, or contributions:
1. Create detailed issue description
2. Include screenshots/error messages
3. Fork and submit pull requests

## License

This project is open source and available under the MIT License.

## Future Enhancements

- [ ] Real-time collaboration on quizzes
- [ ] Advanced analytics dashboard
- [ ] Quiz sharing and public library
- [ ] Multiple question types (fill-in-the-blank, matching)
- [ ] Quiz scheduling and reminders
- [ ] Spaced repetition algorithm
- [ ] Leaderboards and competition mode
- [ ] Mobile app (React Native)

## Acknowledgments

- GoogleAPI for gemini-2.5-flash API
- PyPDF2 for PDF processing
- Flask and community for excellent frameworks

---


