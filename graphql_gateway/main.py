from fastapi import FastAPI
from ariadne import make_executable_schema, gql, load_schema_from_path, QueryType
from ariadne.asgi import GraphQL
import requests

app = FastAPI()
query = QueryType()

@query.field("members")
def resolve_members(_, info):
    return requests.post("http://user_service:5000/graphql", json={
        "query": "{ members { id name phone_number } }"
    }).json()["data"]["members"]

@query.field("books")
def resolve_books(_, info):
    return requests.post("http://book_service:5000/graphql", json={
        "query": "{ books { id title author year } }"
    }).json()["data"]["books"]

# Tambahkan resolvers lainnya untuk loans, reviews, dsb

type_defs = load_schema_from_path("schema.graphql")
schema = make_executable_schema(type_defs, [query])
app.mount("/graphql", GraphQL(schema, debug=True))