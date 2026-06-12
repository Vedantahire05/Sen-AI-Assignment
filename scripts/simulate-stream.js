const axios = require("axios");

const emails = [
  {
    message_id: `stream_${Date.now()}_1`,
    thread_id: "thread_stream_1",
    sender: "john@customer.com",
    subject: "Refund Request",
    body: "I want a refund immediately.",
    timestamp: new Date(),
  },

  {
    message_id: `stream_${Date.now()}_2`,
    thread_id: "thread_stream_2",
    sender: "alice@enterprise.com",
    subject: "GDPR Data Deletion Request",
    body: "Please delete all my personal data under GDPR.",
    timestamp: new Date(),
  },

  {
    message_id: `stream_${Date.now()}_3`,
    thread_id: "thread_stream_3",
    sender: "security@bigcorp.com",
    subject: "Possible Data Breach",
    body: "We suspect unauthorized access to customer data.",
    timestamp: new Date(),
  },

  {
    message_id: `stream_${Date.now()}_4`,
    thread_id: "thread_stream_4",
    sender: "bob.jones@enterprise.net",
    subject: "Legal Escalation",
    body: "Our legal team is now involved and formal correspondence will follow.",
    timestamp: new Date(),
  },

  {
    message_id: `stream_${Date.now()}_5`,
    thread_id: "thread_stream_5",
    sender: "customer@test.com",
    subject: "API Rate Limit Increase",
    body: "We need 10000 requests per minute for our Enterprise plan.",
    timestamp: new Date(),
  },
];

const delay = (ms) =>
  new Promise((resolve) =>
    setTimeout(resolve, ms)
  );

async function simulateStream() {

  console.log(
    "\n===================================="
  );
  console.log(
    "Starting Email Stream Simulation"
  );
  console.log(
    "====================================\n"
  );

  for (const email of emails) {

    try {

      // STEP 1: INGEST
      const ingestResponse =
        await axios.post(
          "http://localhost:5000/api/ingest",
          email
        );

      console.log(
        `📩 Inserted: ${email.subject}`
      );

      if (
        !ingestResponse.data.success ||
        !ingestResponse.data.email
      ) {

        console.log(
          "Skipping classification"
        );

        console.log(
          ingestResponse.data
        );

        continue;
      }

      const emailId =
        ingestResponse.data.email._id;

      // STEP 2: CLASSIFY
      const classifyResponse =
        await axios.get(
          `http://localhost:5000/classifier/${emailId}`
        );

      console.log(
        `🤖 Classified: ${email.subject}`
      );

      console.log({
        category:
          classifyResponse.data
            .classification.category,

        sentiment:
          classifyResponse.data
            .classification.sentiment,

        urgency:
          classifyResponse.data
            .classification.urgency,

        requiresHuman:
          classifyResponse.data
            .classification
            .requires_human,
      });

      console.log(
        "------------------------------------"
      );

    } catch (error) {

      console.log(
        `❌ Failed: ${email.subject}`
      );

      console.log(
        error.response?.data ||
        error.message
      );

      console.log(
        "------------------------------------"
      );
    }

    await delay(3000);
  }

  console.log(
    "\n===================================="
  );
  console.log(
    "Simulation Complete"
  );
  console.log(
    "====================================\n"
  );
}

simulateStream();