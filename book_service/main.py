from fastapi import FastAPI
from ariadne import QueryType, MutationType, make_executable_schema, load_schema_from_path
from ariadne.asgi import GraphQL
from database import init_db, get_db
import requests

# Definisikan resolvers
query = QueryType()
mutation = MutationType()

@query.field("books")
def resolve_books(_, info):
    conn = get_db()
    rows = conn.execute("SELECT * FROM books").fetchall()
    conn.close()
    return [dict(row) for row in rows]

@query.field("book")
def resolve_book(_, info, id):
    conn = get_db()
    row = conn.execute("SELECT * FROM books WHERE id = ?", (id,)).fetchone()
    conn.close()
    return dict(row) if row else None

@mutation.field("createBook")
def create_book(_, info, title, author=None, year=None, jumlah=1):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("INSERT INTO books (title, author, year, jumlah) VALUES (?, ?, ?, ?)", (title, author, year, jumlah))
    conn.commit()
    book_id = cur.lastrowid
    conn.close()
    return {"id": book_id, "title": title, "author": author, "year": year, "jumlah": jumlah}

@mutation.field("updateStok")
def update_stok(_, info, bookId, jumlah):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE books SET jumlah = ? WHERE id = ?", (jumlah, bookId))
    conn.commit()
    row = cur.execute("SELECT * FROM books WHERE id = ?", (bookId,)).fetchone()
    conn.close()
    return dict(row) if row else None

# Load schema dan buat executable schema
try:
    type_defs = load_schema_from_path("schema.graphql")
    schema = make_executable_schema(type_defs, [query, mutation])
except FileNotFoundError:
    print("Error: schema.graphql file not found!")
    raise

# Buat FastAPI app
app = FastAPI(title="Books GraphQL API")

# Mount GraphQL endpoint
app.mount("/graphql", GraphQL(schema, debug=True))

# Tambahkan root endpoint untuk testing
@app.get("/")
def read_root():
    return {"message": "GraphQL API is running", "graphql_endpoint": "/graphql"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}


# Initialize database on startup
@app.on_event("startup")
def startup():
    init_db()
    print("Database initialized successfully!")
    print("GraphQL endpoint available at: http://127.0.0.1:5001/graphql")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)