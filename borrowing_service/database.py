import sqlite3

DB_NAME = "loans.db"

def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("""
    CREATE TABLE IF NOT EXISTS loans (
        id INTEGER PRIMARY KEY,
        member_id INTEGER,
        book_id INTEGER,
        tanggal_peminjaman TEXT,
        tanggal_jatuh_tempo TEXT,
        tanggal_pengembalian TEXT,
        status TEXT,
        denda INTEGER
    )
    """)
    conn.commit()