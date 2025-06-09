from fastapi import FastAPI
from ariadne import QueryType, MutationType, make_executable_schema, load_schema_from_path
from ariadne.asgi import GraphQL
from database import init_db, get_db
from datetime import datetime

query = QueryType()
mutation = MutationType()

@query.field("borrowings")
def resolve_borrowings(_, info):
    conn = get_db()
    rows = conn.execute("SELECT * FROM loans").fetchall()
    return [dict(r) for r in rows]

@mutation.field("borrowBook")
def borrow_book(_, info, memberId, bookId, tanggal_peminjaman):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("INSERT INTO loans (member_id, book_id, tanggal_peminjaman, status, denda) VALUES (?, ?, ?, ?, ?)",
                (memberId, bookId, tanggal_peminjaman, "dipinjam", 0))
    conn.commit()
    return {"id": cur.lastrowid, "member_id": memberId, "book_id": bookId, "tanggal_peminjaman": tanggal_peminjaman, "status": "dipinjam", "denda": 0}

@mutation.field("returnBook")
def return_book(_, info, loanId):
    conn = get_db()
    cur = conn.cursor()
    today = datetime.today().strftime("%Y-%m-%d")
    cur.execute("UPDATE loans SET tanggal_pengembalian = ?, status = 'dikembalikan' WHERE id = ?", (today, loanId))
    conn.commit()
    return {"id": loanId, "status": "dikembalikan", "tanggal_pengembalian": today}

schema = make_executable_schema(load_schema_from_path("schema.graphql"), [query, mutation])
app = FastAPI()
app.mount("/graphql", GraphQL(schema, debug=True))

@app.on_event("startup")
def startup():
    init_db()