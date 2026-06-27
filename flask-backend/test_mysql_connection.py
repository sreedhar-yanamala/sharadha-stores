"""
test_mysql_connection.py
─────────────────────────
Quick connection test for the MySQL database.
Run this to verify your .env settings before starting Flask.

Usage:
    python test_mysql_connection.py
"""

import os
import sys
from dotenv import load_dotenv

load_dotenv()

def main():
    print("=" * 55)
    print("  Sharadha Stores — MySQL Connection Test")
    print("=" * 55)

    db_url = os.getenv('DATABASE_URL', '')
    mysql_host = os.getenv('MYSQL_HOST', 'localhost')
    mysql_port = int(os.getenv('MYSQL_PORT', 3306))
    mysql_user = os.getenv('MYSQL_USER', 'root')
    mysql_pass = os.getenv('MYSQL_PASSWORD', '')
    mysql_db   = os.getenv('MYSQL_DATABASE', 'sharadha_stores')

    print(f"  DATABASE_URL : {db_url[:40]}..." if len(db_url) > 40 else f"  DATABASE_URL : {db_url}")
    print(f"  Host         : {mysql_host}:{mysql_port}")
    print(f"  User         : {mysql_user}")
    print(f"  Database     : {mysql_db}")
    print()

    # Check if still using SQLite
    if 'sqlite' in db_url:
        print("⚠  WARNING: DATABASE_URL is still pointing to SQLite!")
        print("   Edit flask-backend/.env and set DATABASE_URL to:")
        print("   mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/sharadha_stores")
        print()

    # Test raw PyMySQL connection
    try:
        import pymysql
    except ImportError:
        print("✗ PyMySQL not installed. Run: pip install pymysql cryptography")
        sys.exit(1)

    try:
        conn = pymysql.connect(
            host=mysql_host, port=mysql_port,
            user=mysql_user, password=mysql_pass,
            database=mysql_db, charset='utf8mb4',
            connect_timeout=5,
        )
        cursor = conn.cursor()

        # Check tables
        cursor.execute("SHOW TABLES")
        tables = [row[0] for row in cursor.fetchall()]
        print(f"✓ MySQL connected successfully!")
        print(f"  Database     : {mysql_db}")
        print(f"  Tables found : {len(tables)}")
        if tables:
            for t in sorted(tables):
                cursor.execute(f"SELECT COUNT(*) FROM `{t}`")
                count = cursor.fetchone()[0]
                print(f"    • {t:35s} {count:>6} rows")
        else:
            print("  No tables yet — Flask will create them on first run.")

        # Check required tables
        required = [
            'users', 'products', 'categories', 'orders', 'order_items',
            'addresses', 'payments', 'reviews', 'cart', 'cart_items',
            'wishlist', 'wishlist_items', 'coupons', 'inventory',
            'contact_messages', 'newsletter_subscribers',
        ]
        missing = [t for t in required if t not in tables]
        if missing:
            print(f"\n  ⚠  Missing tables (will be created by Flask): {', '.join(missing)}")
        else:
            print(f"\n  ✓ All {len(required)} required tables present!")

        cursor.close()
        conn.close()
        print("\n✓ Test complete — MySQL is ready for Sharadha Stores.")

    except pymysql.err.OperationalError as e:
        print(f"✗ Connection failed: {e}")
        print()
        print("  Possible causes:")
        print("  1. MySQL is not installed or not running")
        print("     → Install MySQL: https://dev.mysql.com/downloads/installer/")
        print("  2. Wrong password in MYSQL_PASSWORD in .env")
        print("  3. Database 'sharadha_stores' not created yet")
        print("     → Run: mysql -u root -p < mysql_setup.sql")
        sys.exit(1)


if __name__ == '__main__':
    main()
