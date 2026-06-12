const axios = require("axios");

const getRagContext = async (query) => {
  try {

    const url =
      `http://127.0.0.1:8000/rag/search?query=${encodeURIComponent(query)}`;

    console.log("\n========== RAG REQUEST ==========");
    console.log(url);

    const response = await axios.get(url, {
      timeout: 10000
    });

    console.log("\n========== RAG RAW RESPONSE ==========");
    console.log(
      JSON.stringify(
        response.data,
        null,
        2
      )
    );
    console.log("\n======================================\n");

    if (
      response.data &&
      response.data.results
    ) {
      return response.data.results;
    }

    return response.data || [];

  } catch (error) {

    console.log("\n========== FULL RAG ERROR ==========\n");

    if (error.response) {

      console.log(
        "STATUS:",
        error.response.status
      );

      console.log(
        "DATA:",
        JSON.stringify(
          error.response.data,
          null,
          2
        )
      );

    } else if (error.request) {

      console.log(
        "NO RESPONSE RECEIVED"
      );

      console.log(
        error.message
      );

    } else {

      console.log(
        "REQUEST ERROR:"
      );

      console.log(
        error.message
      );

    }

    console.log(
      "\n====================================\n"
    );

    return [];
  }
};

module.exports = getRagContext;