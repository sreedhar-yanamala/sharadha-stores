"""
migrate_sqlite_to_mysql.py
──────────────────────────
One-time migration script: copies all data from SQLite (sharadha.db)
into the MySQL sharadha_stores database.

Usage:
    python migrate_sqlite_to_mysql.py

Requirements:
  - MySQL database created (run mysql_setup.sql first, or let Flask create tables)
  - DATABASE_URL in .env pointing at MySQL
  - sqlite3 (built into Python)
  - PyMySQL installed  (pip install pymysql)
"""

import os
import sys
import sqlite3
import json
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# ── Verify dependencies ──────────────────────────────────────────────────────
try:
    import pymysql
except ImportError:
    sys.exit("PyMySQL not installed. Run: pip install pymysql")

# ── Source SQLite ─────────────────────────────────────────────────────────────
SQLITE_PATH = os.path.join(os.path.dirname(__file__), 'sharadha.db')
if not os.path.exists(SQLITE_PATH):
    sys.exit(f"SQLite file not found: {SQLITE_PATH}")

# ── Target MySQL ──────────────────────────────────────────────────────────────
MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
MYSQL_PORT = int(os.getenv('MYSQL_PORT', 3306))
MYSQL_USER = os.getenv('MYSQL_USER', 'root')
MYSQL_PASS = os.getenv('MYSQL_PASSWORD', '')
MYSQL_DB   = os.getenv('MYSQL_DATABASE', 'sharadha_stores')


def get_mysql_conn():
    return pymysql.connect(
        host=MYSQL_HOST, port=MYSQL_PORT,
        user=MYSQL_USER, password=MYSQL_PASS,
        database=MYSQL_DB, charset='utf8mb4',
        autocommit=False,
    )


def get_sqlite_conn():
    conn = sqlite3.connect(SQLITE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


TABLES_IN_ORDER = [
    'users', 'addresses', 'password_reset_otps', 'login_otps',
    'categories', 'products', 'product_images', 'product_ingredients',
    'reviews', 'orders', 'order_shipping_address', 'order_items',
    'order_status_timeline', 'inventory', 'inventory_batches',
    'subscriptions', 'subscription_items',
    'support_tickets', 'ticket_responses',
]


def table_exists_sqlite(sqlite_cur, table):
    sqlite_cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,))
    return sqlite_cur.fetchone() is not None


def migrate_table(table, sqlite_cur, mysql_cur):
    if not table_exists_sqlite(sqlite_cur, table):
        print(f"  ⚠  [{table}] not found in SQLite — skipping")
        return 0

    sqlite_cur.execute(f"SELECT * FROM {table}")
    rows = sqlite_cur.fetchall()
    if not rows:
        print(f"  ○  [{table}] empty — skipping")
        return 0

    cols    = [desc[0] for desc in sqlite_cur.description]
    placeholders = ', '.join(['%s'] * len(cols))
    col_names    = ', '.join(f'`{c}`' for c in cols)
    sql = f"INSERT IGNORE INTO `{table}` ({col_names}) VALUES ({placeholders})"

    count = 0
    for row in rows:
        values = []
        for val in row:
            # Convert SQLite integer booleans to MySQL-compatible values
            if isinstance(val, int) and val in (0, 1) and False:
                values.append(bool(val))
            else:
                values.append(val)
        try:
            mysql_cur.execute(sql, tuple(values))
            count += 1
        except Exception as e:
            print(f"    ✗ Row insert error in {table}: {e}")
    return count


def main():
    print("=" * 60)
    print("  Sharadha Stores: SQLite → MySQL Migration")
    print("=" * 60)
    print(f"  Source: {SQLITE_PATH}")
    print(f"  Target: {MYSQL_USER}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}")
    print()

    try:
        mysql_conn = get_mysql_conn()
        print("✓ Connected to MySQL")
    except Exception as e:
        sys.exit(f"✗ MySQL connection failed: {e}")

    sqlite_conn = get_sqlite_conn()
    sqlite_cur  = sqlite_conn.cursor()
    mysql_cur   = mysql_conn.cursor()

    # Disable FK checks during import
    mysql_cur.execute("SET FOREIGN_KEY_CHECKS = 0")

    total_rows = 0
    for table in TABLES_IN_ORDER:
        try:
            count = migrate_table(table, sqlite_cur, mysql_cur)
            if count:
                print(f"  ✓  [{table}] migrated {count} rows")
                total_rows += count
        except Exception as e:
            print(f"  ✗  [{table}] failed: {e}")
            mysql_conn.rollback()

    mysql_cur.execute("SET FOREIGN_KEY_CHECKS = 1")
    mysql_conn.commit()

    sqlite_conn.close()
    mysql_cur.close()
    mysql_conn.close()

    print()
    print(f"Migration complete! {total_rows} total rows migrated.")
    print("You can now point your Flask app to MySQL and restart the server.")


if __name__ == '__main__':
    main()
