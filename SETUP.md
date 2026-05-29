# Quick Start Guide - SaliSikhayAI

## 5-Minute Setup

### Windows Setup

```bash
# 1. Navigate to project
cd c:\Users\Administrator\Documents\appdev_finals

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
venv\Scripts\activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Configure PostgreSQL connection
# Edit .env file:
copy .env.example .env
# Update DATABASE_URL with your PostgreSQL credentials

# 6. Start Flask application
python app.py
```

The app will be available at: **http://localhost:5000**

## Database Setup

### Using PostgreSQL

```bash
# Create database
createdb salisikhay

# In .env file, set:
DATABASE_URL=postgresql://postgres:password@localhost:5432/salisikhay

# Note: Modify the username/password according to your PostgreSQL setup
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

## Project Structure

```
appdev_finals/
├── app.py                 # Flask application entry point
├── config.py             # Configuration settings
├── models.py             # Database models
├── requirements.txt      # Python dependencies
├── README.md             # Full documentation
├── .env                  # Environment variables (create from .env.example)
├── static/              # Frontend files
│   ├── index.html       # Login/Register page
│   ├── dashboard.html   # Main quiz interface
│   ├── quiz.html        # Quiz taking page
│   ├── results.html     # Results page
│   ├── style.css        # Main stylesheet
│   ├── app.js           # Authentication & utilities
│   ├── dashboard.js     # Dashboard logic
│   ├── quiz.js          # Quiz interface
│   ├── results.js       # Results display
│   ├── manifest.json    # PWA configuration
│   └── service-worker.js # Offline support
├── routes/              # API endpoints
│   ├── auth.py          # Authentication routes
│   ├── quiz.py          # Quiz management routes
│   └── pdf.py           # PDF upload routes
├── services/            # Business logic
│   ├── ai_service.py    # AI quiz generation
│   └── pdf_service.py   # PDF processing
└── uploads/             # Uploaded files storage
```

## Development vs Production

### Development
```bash
# Auto-reload on changes
python app.py  # Flask debug mode is enabled
```

### Production
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:create_app()
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

## Next Steps

1. ✅ Database setup complete
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
