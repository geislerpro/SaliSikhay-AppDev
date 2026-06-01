# SaliSikhayAI - Setup Guide

## 🚀 Quick Start (Local Development)

### Windows Setup - 5 Minutes

```bash
# 1. Navigate to project
cd c:\Users\Administrator\Documents\appdev_finals

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
venv\Scripts\activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Configure environment
copy .env.example .env
# Edit .env and add your API keys

# 6. Start Flask application
python app.py
```

App available at: **http://localhost:5000**

## 💾 Database Setup

### Local Development (SQLite - Default)

```bash
# No setup needed! SQLite is default and auto-creates:
# instance/salisikhay.db

# Just run:
python app.py
```

### Production with PostgreSQL

```bash
# Create database
createdb salisikhay

# In .env file, set:
DATABASE_URL=postgresql://user:password@localhost:5432/salisikhay
```

## Using the App

1. **Register** - Create a new account
2. **Generate Quiz** - Either:
   - Type a topic and let AI generate quiz (requires OpenAI API key in .env)
   - Upload a PDF/TXT file and extract quiz automatically
3. **Take Quiz** - Answer questions and get instant results
4. **Review Results** - See detailed statistics and answer review

## Optional: OpenAI Integration

To enable AI-powered quiz generation:

1. Get API key from https://platform.openai.com/api-keys
2. Add to .env file:
   ```
   OPENAI_API_KEY=sk-your-key-here
   ```
3. Without this key, the app uses fallback mock data for quiz generation

## Troubleshooting

### ImportError: No module named 'flask'
- Ensure virtual environment is activated
- Run: `pip install -r requirements.txt`

### PostgreSQL Connection Error
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Make sure database 'salisikhay' exists

### Port 5000 Already in Use
- Change port in app.py: `app.run(port=5001)`
- Or kill the process using port 5000

## 📁 Project Structure

```
appdev_finals/
├── 🎯 Core
│   ├── app.py                 # Flask app entry point
│   ├── config.py              # Config & environment setup
│   ├── models.py              # Database models
│   └── requirements.txt        # Python dependencies
├── 🎨 Frontend (/static)
│   ├── index.html             # Login/Register
│   ├── dashboard.html         # Quiz dashboard
│   ├── quiz.html              # Quiz taker
│   ├── results.html           # Results view
│   ├── style.css              # Responsive styling
│   ├── app.js, dashboard.js, quiz.js, results.js  # JS logic
│   ├── manifest.json          # PWA manifest
│   ├── service-worker.js      # Offline support
│   └── voice-control.js       # Voice recognition
├── 🛤️ API Routes (/routes)
│   ├── auth.py                # Auth endpoints
│   ├── quiz.py                # Quiz endpoints
│   └── pdf.py                 # PDF upload
├── ⚙️ Services (/services)
│   ├── ai_service.py          # AI quiz generation
│   └── pdf_service.py         # PDF text extraction
├── 📦 Data
│   ├── uploads/               # User uploaded files
│   └── instance/              # SQLite database
└── 📚 Docs
    ├── README.md              # Full documentation
    ├── SETUP.md               # This file
    ├── IMPLEMENTATION_SUMMARY.md  # What's included
    └── .env.example           # Environment template
```

## 🔄 Running the App

### Development (Local)
```bash
python app.py
# Debug mode enabled, auto-reload on file changes
# Access: http://localhost:5000
```

### Production (Gunicorn)
```bash
# Add gunicorn to requirements.txt:
pip install gunicorn

# Run with Gunicorn:
gunicorn -w 4 -b 0.0.0.0:5000 app:create_app()
```

### Railway Deployment
```bash
# 1. Add Procfile to project root:
# web: gunicorn app:create_app()

# 2. Add PostgreSQL plugin in Railway dashboard
# 3. Push to GitHub
# 4. Railway automatically deploys and sets DATABASE_URL
```

## Testing the API

Use curl or Postman to test endpoints:

```bash
# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"password123"}'

# Create quiz from topic
curl -X POST http://localhost:5000/api/quiz/create-from-topic \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"topic":"Python Programming","num_questions":5}'
```

## 🔑 Environment Variables

```bash
# .env file (create from .env.example)

# Database (auto-set by Railway, or use local SQLite)
DATABASE_URL=sqlite:///instance/salisikhay.db  # Local
# DATABASE_URL=postgresql://user:pass@host/db  # Production

# JWT Secret (change in production!)
JWT_SECRET_KEY=your-secret-key-change-in-production

# Google Gemini API (for AI quiz generation)
GOOGLE_API_KEY=your-api-key-here

# Optional: OpenAI API (alternative AI provider)
OPENAI_API_KEY=sk-your-key-here
```

## 🐛 Troubleshooting

### Network Error with Voice Control
- **Cause**: Browser can't reach Google's speech recognition servers
- **Fix**: Check internet connection, use Chrome/Edge, check microphone permissions
- **Note**: Requires internet connection (no offline voice support)

### Database Connection Error
- Ensure PostgreSQL is running (production)
- Check DATABASE_URL in .env
- SQLite uses local file (development)

### Port 5000 Already in Use
- Change port: Edit `app.py` line ~83 to use different port
- Or kill process: `Get-Process -Name python | Stop-Process` (Windows)

### ModuleNotFoundError
- Activate virtual environment: `venv\Scripts\activate`
- Install dependencies: `pip install -r requirements.txt`

## ✅ Next Steps

1. ✅ Environment setup complete
2. ✅ Backend API ready
3. ✅ Frontend interface ready
4. ✅ PWA support enabled
5. **Optional**: Connect OpenAI API for better quiz generation
6. **Optional**: Deploy to cloud (Heroku, Azure, AWS)
7. **Optional**: Enable custom domain and SSL

## Support

Refer to README.md for:
- Full API documentation
- Database schema details
- Deployment guides
- Advanced configuration
- Troubleshooting guide
