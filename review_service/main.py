from fastapi import FastAPI
from ariadne import QueryType, MutationType, make_executable_schema, load_schema_from_path
from ariadne.asgi import GraphQL
from database import init_db, get_db

query = QueryType()
mutation = MutationType()

@query.field("reviews")
def resolve_reviews(_, info, bookId=None):
    conn = get_db()
    if bookId:
        rows = conn.execute("SELECT * FROM reviews WHERE book_id = ?", (bookId,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM reviews").fetchall()
    return [dict(r) for r in rows]

@mutation.field("addReview")
def add_review(_, info, memberId, bookId, rating, comment):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("INSERT INTO reviews (member_id, book_id, rating, comment) VALUES (?, ?, ?, ?)",
                (memberId, bookId, rating, comment))
    conn.commit()
    return {"id": cur.lastrowid, "member_id": memberId, "book_id": bookId, "rating": rating, "comment": comment}

schema = make_executable_schema(load_schema_from_path("schema.graphql"), [query, mutation])
app = FastAPI()
app.mount("/graphql", GraphQL(schema, debug=True))

@app.on_event("startup")
def startup():
    init_db()