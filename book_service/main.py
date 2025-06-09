from fastapi import FastAPI
from ariadne import QueryType, MutationType, make_executable_schema, load_schema_from_path
from ariadne.asgi import GraphQL
from database import init_db, get_db

query = QueryType()
mutation = MutationType()

@query.field("books")
def resolve_books(_, info):
    conn = get_db()
    rows = conn.execute("SELECT * FROM books").fetchall()
    return [dict(r) for r in rows]

@mutation.field("createBook")
def create_book(_, info, title, author=None, year=None):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("INSERT INTO books (title, author, year) VALUES (?, ?, ?)", (title, author, year))
    conn.commit()
    return {"id": cur.lastrowid, "title": title, "author": author, "year": year}

schema = make_executable_schema(load_schema_from_path("schema.graphql"), [query, mutation])
app = FastAPI()
app.mount("/graphql", GraphQL(schema, debug=True))

@app.on_event("startup")
def startup():
    init_db()