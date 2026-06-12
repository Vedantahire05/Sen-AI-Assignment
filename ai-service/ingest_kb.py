import os
import shutil
import chromadb

from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer

BASE_DIR = os.path.dirname(
    os.path.dirname(__file__)
)

KB_DIR = os.path.join(
    BASE_DIR,
    "knowledge-base"
)

CHROMA_DIR = "./chroma_db"

# -----------------------------------
# RESET CHROMA DB EVERY INGEST
# -----------------------------------

if os.path.exists(CHROMA_DIR):
    shutil.rmtree(CHROMA_DIR)

client = chromadb.PersistentClient(
    path=CHROMA_DIR
)

collection = client.create_collection(
    name="knowledge_base"
)

# -----------------------------------
# EMBEDDING MODEL
# -----------------------------------

model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)

splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=100
)

# -----------------------------------
# INGEST FILES
# -----------------------------------

for filename in os.listdir(KB_DIR):

    if not filename.endswith(".md"):
        continue

    path = os.path.join(
        KB_DIR,
        filename
    )

    with open(
        path,
        "r",
        encoding="utf-8"
    ) as file:

        content = file.read()

    chunks = splitter.split_text(
        content
    )

    embeddings = model.encode(
        chunks
    ).tolist()

    ids = [
        f"{filename}_{i}"
        for i in range(len(chunks))
    ]

    metadatas = [
        {
            "source_doc": filename
        }
        for _ in chunks
    ]

    collection.add(
        ids=ids,
        documents=chunks,
        embeddings=embeddings,
        metadatas=metadatas
    )

    print(
        f"Indexed {filename} ({len(chunks)} chunks)"
    )

print(
    "\nKnowledge Base Ingested Successfully"
)