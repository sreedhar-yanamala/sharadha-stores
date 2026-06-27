import os
import sys
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY  = os.getenv('JWT_SECRET', 'sharadha_stores_secret_key_12345')
    JWT_SECRET  = os.getenv('JWT_SECRET', 'sharadha_stores_secret_key_12345')

    # ── Database ──────────────────────────────────────────────────────────────
    # REQUIRED: Must be a MySQL connection URL.
    # Format: mysql+pymysql://user:password@host:port/database
    # Set this in flask-backend/.env → DATABASE_URL
    _db_url = os.getenv('DATABASE_URL', '')

    if not _db_url:
        print(
            "\n[FATAL] DATABASE_URL is not set in flask-backend/.env\n"
            "  Set it to: mysql+pymysql://root:PASSWORD@localhost:3306/sharadha_stores\n",
            file=sys.stderr
        )
        sys.exit(1)

    if _db_url.startswith('sqlite'):
        print(
            "\n[FATAL] SQLite is no longer supported. DATABASE_URL must use MySQL.\n"
            "  Current value: " + _db_url + "\n"
            "  Required format: mysql+pymysql://root:PASSWORD@localhost:3306/sharadha_stores\n"
            "  Run: python full_mysql_setup.py  to configure MySQL automatically.\n",
            file=sys.stderr
        )
        sys.exit(1)

    SQLALCHEMY_DATABASE_URI    = _db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ── MySQL connection pool ─────────────────────────────────────────────────
    # pool_recycle: recycle connections idle > 280 s (before MySQL 8-hour timeout)
    # pool_pre_ping: detect stale connections automatically
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_recycle': 280,
        'pool_pre_ping': True,
        'pool_size':    10,
        'max_overflow': 20,
    }

    PORT  = int(os.getenv('PORT', 5000))
    DEBUG = os.getenv('NODE_ENV', 'development') == 'development'

    # JWT expiry: 30 days in seconds
    JWT_EXPIRES_IN = 60 * 60 * 24 * 30

    # Frontend origin (used for CORS)
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
