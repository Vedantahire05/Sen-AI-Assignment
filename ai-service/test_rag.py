# test_rag.py

from rag_search import search

result = search(
    "customer wants refund and threatens public review"
)

print(result)