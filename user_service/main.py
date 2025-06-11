from fastapi import FastAPI
from ariadne import QueryType, MutationType, make_executable_schema, load_schema_from_path, ObjectType
from ariadne.asgi import GraphQL
from database import init_db, get_db
import requests

# Definisikan resolvers
query = QueryType()
mutation = MutationType()

@query.field("members")
def resolve_members(_, info):
    conn = get_db()
    try:
        rows = conn.execute("SELECT * FROM members").fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

@query.field("member")
def resolve_member(_, info, id):
    conn = get_db()
    try:
        row = conn.execute("SELECT * FROM members WHERE id = ?", (id,)).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()

@mutation.field("registerMember")
def register_member(_, info, name, phone):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("INSERT INTO members (name, phone_number) VALUES (?, ?)", (name, phone))
        conn.commit()
        member_id = cur.lastrowid
        return {"id": member_id, "name": name, "phone_number": phone}
    finally:
        conn.close()

@mutation.field("updateMember")
def update_member(_, info, id, name=None, phone=None):
    conn = get_db()
    try:
        cur = conn.cursor()
        if name and phone:
            cur.execute("UPDATE members SET name = ?, phone_number = ? WHERE id = ?", (name, phone, id))
        elif name:
            cur.execute("UPDATE members SET name = ? WHERE id = ?", (name, id))
        elif phone:
            cur.execute("UPDATE members SET phone_number = ? WHERE id = ?", (phone, id))
        conn.commit()
        row = cur.execute("SELECT * FROM members WHERE id = ?", (id,)).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()

member = ObjectType("Member")

@member.field("borrowings")
def resolve_borrowings_for_member(obj, info):
    member_id = obj["id"]
    resp = requests.get(f"http://borrowing_service:5002/borrowings?member_id={member_id}")
    if resp.status_code == 200:
        return resp.json()
    return []

# Load schema dan buat executable schema
try:
    type_defs = load_schema_from_path("schema.graphql")
    schema = make_executable_schema(type_defs, [query, mutation, member])
except FileNotFoundError:
    print("Error: schema.graphql file not found!")
    raise

# Buat FastAPI app
app = FastAPI(title="Members GraphQL API")

# Root endpoint
@app.get("/")
def read_root():
    return {
        "message": "Members GraphQL API is running",
        "graphql_endpoint": "/graphql",
        "graphql_playground": "http://127.0.0.1:5000/graphql"
    }

# Mount GraphQL endpoint
app.mount("/graphql", GraphQL(schema, debug=True))

# Initialize database on startup
@app.on_event("startup")
def startup():
    init_db()
    print("GraphQL endpoint available at: http://127.0.0.1:5000/graphql")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)