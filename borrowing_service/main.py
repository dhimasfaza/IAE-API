from fastapi import FastAPI, Query, Request
from ariadne import QueryType, MutationType, make_executable_schema, load_schema_from_path
from ariadne.asgi import GraphQL
from database import init_db, get_db
from datetime import datetime, timedelta
import requests
import contextlib
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Library Loan System", version="1.0.0")

# Book service URL - change this to match your book service port
BOOK_SERVICE_URL = "http://localhost:5001"  # Book service port

# Initialize resolvers
query = QueryType()
mutation = MutationType()

@contextlib.contextmanager
def get_db_connection():
    conn = get_db()
    try:
        yield conn
    finally:
        conn.close()

def check_book_service():
    try:
        resp = requests.get(f"{BOOK_SERVICE_URL}/health", timeout=5)
        return resp.status_code == 200
    except requests.RequestException as e:
        logger.error(f"Book service tidak dapat diakses: {str(e)}")
        return False

@query.field("borrowings")
def resolve_borrowings(_, info):
    with get_db_connection() as conn:
        rows = conn.execute("SELECT * FROM loans").fetchall()
        return [dict(r) for r in rows]

@mutation.field("borrowBook")
def borrow_book(_, info, memberId, bookId, tanggal_peminjaman):
    # Cek apakah book service berjalan
    if not check_book_service():
        raise Exception("Book service tidak dapat diakses. Pastikan service berjalan di port 5001.")

    # Cek stok buku di book_service
    try:
        logger.info(f"Memeriksa stok buku ID: {bookId}")
        resp = requests.get(f"{BOOK_SERVICE_URL}/books/{bookId}/stok", timeout=5)
        if resp.status_code != 200:
            raise Exception(f"Error dari book service: {resp.status_code}")
        
        stok = resp.json().get("jumlah", 0)
        if stok < 1:
            raise Exception("Stok buku habis, tidak bisa dipinjam.")
        
        logger.info(f"Stok buku tersedia: {stok}")
    except requests.RequestException as e:
        logger.error(f"Error saat memeriksa stok: {str(e)}")
        raise Exception(f"Error memeriksa stok buku: {str(e)}")

    with get_db_connection() as conn:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM loans WHERE book_id = ? AND status = 'dipinjam'", (bookId,))
        if cur.fetchone()[0] > 0:
            raise Exception("Buku sedang dipinjam, tidak bisa dipinjam lagi.")

        tanggal_peminjaman_dt = datetime.strptime(tanggal_peminjaman, "%Y-%m-%d")
        tanggal_jatuh_tempo_dt = tanggal_peminjaman_dt + timedelta(days=7)
        tanggal_jatuh_tempo = tanggal_jatuh_tempo_dt.strftime("%Y-%m-%d")
        
        try:
            cur.execute("INSERT INTO loans (member_id, book_id, tanggal_peminjaman, tanggal_jatuh_tempo, status, denda) VALUES (?, ?, ?, ?, ?, ?)",
                        (memberId, bookId, tanggal_peminjaman, tanggal_jatuh_tempo, "dipinjam", 0))
            conn.commit()
            
            # Kurangi stok buku di book_service
            logger.info(f"Mengurangi stok buku ID: {bookId}")
            resp = requests.post(f"{BOOK_SERVICE_URL}/books/{bookId}/kurangi_stok", timeout=5)
            if resp.status_code != 200:
                conn.rollback()
                raise Exception(f"Error saat mengurangi stok: {resp.status_code}")
                
            return {
                "id": cur.lastrowid,
                "member_id": memberId,
                "book_id": bookId,
                "tanggal_peminjaman": tanggal_peminjaman,
                "tanggal_jatuh_tempo": tanggal_jatuh_tempo,
                "status": "dipinjam",
                "denda": 0
            }
        except requests.RequestException as e:
            conn.rollback()
            logger.error(f"Error saat mengurangi stok: {str(e)}")
            raise Exception(f"Error saat mengurangi stok buku: {str(e)}")

@mutation.field("returnBook")
def resolve_return_book(_, info, loanId):
    with get_db_connection() as conn:
        cur = conn.cursor()
        # Ambil data pinjaman
        cur.execute("SELECT * FROM loans WHERE id = ?", (loanId,))
        row = cur.fetchone()
        if not row:
            raise Exception("Tidak menemukan data peminjaman")

        tanggal_peminjaman = datetime.strptime(row["tanggal_peminjaman"], "%Y-%m-%d")
        tanggal_pengembalian = datetime.now()
        selisih_hari = (tanggal_pengembalian - tanggal_peminjaman).days
        denda = 50000 if selisih_hari > 2 else 0

        # Update status dan denda
        cur.execute("UPDATE loans SET tanggal_pengembalian = ?, status = 'dikembalikan', denda = ? WHERE id = ?",
                    (tanggal_pengembalian.strftime("%Y-%m-%d"), denda, loanId))
        conn.commit()

        # Update stok buku di book_service
        try:
            resp = requests.get(f"{BOOK_SERVICE_URL}/books/{row['book_id']}/stok", timeout=5)
            stok_lama = resp.json().get("jumlah", 0) if resp.status_code == 200 else 0
            
            requests.post(f"{BOOK_SERVICE_URL}/graphql", json={
                "query": """
                    mutation UpdateStok($bookId: ID!, $jumlah: Int!) {
                        updateStok(bookId: $bookId, jumlah: $jumlah)
                        { id title jumlah }
                    }
                """,
                "variables": {"bookId": row["book_id"], "jumlah": stok_lama + 1}
            }, timeout=5)
        except requests.RequestException as e:
            # Rollback if book service update fails
            conn.rollback()
            raise Exception(f"Error updating book stock: {str(e)}")

        # Ambil data terbaru
        cur.execute("SELECT * FROM loans WHERE id = ?", (loanId,))
        updated_row = cur.fetchone()
        return dict(updated_row)

# Create GraphQL schema
schema = make_executable_schema(load_schema_from_path("schema.graphql"), [query, mutation])

# Add root endpoint
@app.get("/")
def read_root():
    return {
        "message": "Library Loan System API",
        "graphql_endpoint": "/graphql",
        "status": "running"
    }

# Add health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Mount GraphQL
app.mount("/graphql", GraphQL(schema, debug=True))

# Initialize database on startup
@app.on_event("startup")
def startup():
    init_db()
    print("Database initialized successfully")
    print("GraphQL endpoint available at: http://127.0.0.1:5002/graphql")

@app.get("/books/{book_id}/stok")
def get_stok(book_id: int):
    conn = get_db()
    row = conn.execute("SELECT jumlah FROM books WHERE id = ?", (book_id,)).fetchone()
    conn.close()
    if row:
        return {"jumlah": row["jumlah"]}
    return {"jumlah": 0}

@app.post("/books/{book_id}/kurangi_stok")
def kurangi_stok(book_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE books SET jumlah = jumlah - 1 WHERE id = ? AND jumlah > 0", (book_id,))
    conn.commit()
    conn.close()
    return {"success": True}

@app.get("/loans/check")
def check_loan(member_id: int = Query(...), book_id: int = Query(...)):
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM loans WHERE member_id = ? AND book_id = ? AND status = 'dikembalikan'",
        (member_id, book_id)
    ).fetchone()
    conn.close()
    return {"boleh_review": bool(row)}

@app.get("/borrowings")
def get_borrowings_by_member(member_id: int):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM loans WHERE member_id = ?", (member_id,)
    ).fetchall()
    conn.close()
    # Ubah hasil ke list of dict agar bisa di-serialize ke JSON
    return [dict(r) for r in rows]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5002)