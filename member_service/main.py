from fastapi import FastAPI
from ariadne import QueryType, MutationType, make_executable_schema, load_schema_from_path
from ariadne.asgi import GraphQL
from database import init_db, get_db

query = QueryType()
mutation = MutationType()

@query.field("members")
def resolve_members(_, info):
    conn = get_db()
    rows = conn.execute("SELECT * FROM members").fetchall()
    return [dict(r) for r in rows]

@mutation.field("registerMember")
def register_member(_, info, name, phone):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("INSERT INTO members (name, phone_number) VALUES (?, ?)", (name, phone))
    conn.commit()
    return {"id": cur.lastrowid, "name": name, "phone_number": phone}

schema = make_executable_schema(load_schema_from_path("schema.graphql"), [query, mutation])
app = FastAPI()
app.mount("/graphql", GraphQL(schema, debug=True))

@app.on_event("startup")
def startup():
    init_db()