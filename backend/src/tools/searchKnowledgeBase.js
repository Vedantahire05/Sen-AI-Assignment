const getRagContext = require("../services/ragService");

const searchKnowledgeBase = async (query) => {
  try {
    const results = await getRagContext(query);

    if (!results) {
      return [];
    }

    // Normalize ChromaDB response
    if (
      results.documents &&
      Array.isArray(results.documents) &&
      results.documents.length > 0
    ) {
      const documents = results.documents[0] || [];
      const metadatas = results.metadatas?.[0] || [];
      const distances = results.distances?.[0] || [];

      return documents.map((doc, index) => ({
        text: doc,
        source:
          metadatas[index]?.source_doc ||
          "knowledge_base",
        score:
          distances[index] != null
            ? Number(
                (
                  1 /
                  (1 + distances[index])
                ).toFixed(3)
              )
            : null,
      }));
    }

    if (Array.isArray(results)) {
      return results;
    }

    return [results];
  } catch (error) {
    console.error(
      "Knowledge Base Search Error:",
      error.message
    );

    return [];
  }
};

module.exports = searchKnowledgeBase;