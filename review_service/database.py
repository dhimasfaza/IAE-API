import sqlite3

DB_NAME = "reviews.db"

def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("""
    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY,
        book_id INTEGER,
        member_id INTEGER,
        reviewer TEXT,
        rating INTEGER,
        comment TEXT
    )
    """)
    conn.commit()