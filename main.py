from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict

app = FastAPI()

countries_db = [
    {"name": "Indonesia", "population": 273523621, "currency": "IDR", "language": "Indonesian", "region": "Asia"},
    {"name": "Japan", "population": 125800000, "currency": "JPY", "language": "Japanese", "region": "Asia"}
]

class Country(BaseModel):
    name: str
    population: int
    currency: str
    language: str
    region: str

@app.get("/countries", response_model=List[Dict])
def get_countries():
    return countries_db

@app.get("/countries/{name}")
def get_country(name: str):
    for country in countries_db:
        if country["name"].lower() == name.lower():
            return country
    raise HTTPException(status_code=404, detail="Negara tidak ditemukan")

@app.post("/countries")
def add_country(country: Country):
    new_country = country.dict()
    countries_db.append(new_country)
    return {"message": "Negara berhasil ditambahkan", "data": new_country}

@app.delete("/countries/{name}")
def delete_country(name: str):
    for i, country in enumerate(countries_db):
        if country["name"].lower() == name.lower():
            del countries_db[i]
            return {"message": f"Negara {name} berhasil dihapus"}
    raise HTTPException(status_code=404, detail="Negara tidak ditemukan")
