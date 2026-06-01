import os
from dotenv import load_dotenv

# Force load .env file from project root
basedir = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.join(basedir, '.env')
print(f"🔍 Loading .env from: {dotenv_path}")
print(f"🔍 .env exists: {os.path.exists(dotenv_path)}")

# Load .env only if it exists; otherwise rely on environment variables
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path, override=True)
else:
    print("⚠️ .env file not found. Using environment variables only.")

# Verify the .env was loaded
if os.path.exists(dotenv_path):
    with open(dotenv_path, 'r') as f:
        env_content = f.read()
        if 'GOOGLE_API_KEY=' in env_content:
            print("✓ .env file contains GOOGLE_API_KEY")

class Config:
    """Flask configuration"""
    # Resolve database URI: prefer DATABASE_URL (set by Railway when PostgreSQL
    # is provisioned), fall back to SQLite for local development only.
    # Railway may supply the legacy "postgres://" scheme; SQLAlchemy 2.x requires
    # "postgresql://", so we normalise it here.
    _db_url = os.getenv('DATABASE_URL', 'sqlite:///salisikhay.db')
    if _db_url.startswith('postgres://'):
        _db_url = _db_url.replace('postgres://', 'postgresql://', 1)
    SQLALCHEMY_DATABASE_URI = _db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT Configuration
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
    
    # Google Gemini Configuration - Get directly from environment after load_dotenv
    GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY', '').strip()

    # Debug output - check both the class variable and the environment
    print(f"🔍 Config loaded: GOOGLE_API_KEY length = {len(GOOGLE_API_KEY)}")
    print(f"🔍 os.environ GOOGLE_API_KEY = '{os.environ.get('GOOGLE_API_KEY', 'NOT SET')}'")
    print(f"🔍 Are they equal? {GOOGLE_API_KEY == os.environ.get('GOOGLE_API_KEY', '')}")
    if GOOGLE_API_KEY:
        print("✓ GOOGLE_API_KEY is configured.")
    else:
        print("⚠️ GOOGLE_API_KEY is missing. Set it in .env or the environment before running the app.")

    # File Upload Configuration
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB max file size
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
    ALLOWED_EXTENSIONS = {'pdf', 'txt', 'docx'}
