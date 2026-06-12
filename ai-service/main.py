from fastapi import FastAPI
from rag_search import search

app = FastAPI()

@app.get("/rag/search")
def rag_search(query: str):

    result = search(query)

    return {
        "results": result
    }