const getRagContext =
require("../services/ragService");

const searchRag = async (
  req,
  res
) => {
  try {

    const query =
      req.query.q;

    if (!query) {
      return res.status(400).json({
        success: false,
        message:
          "Query parameter q required",
      });
    }

    const results =
      await getRagContext(query);

    return res.json({
      success: true,
      query,
      results,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message:
        error.message,
    });

  }
};

module.exports = {
  searchRag,
};