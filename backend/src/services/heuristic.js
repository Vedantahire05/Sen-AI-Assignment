const spamKeywords = [
  "seo",
  "inheritance",
  "claim your share",
  "limited offer",
  "collab"
];

const urgentKeywords = [
  "urgent",
  "p0",
  "legal",
  "cease and desist",
  "ransomware"
];

const securityKeywords = [
  "breach",
  "btc",
  "publish data",
  "north korea",
  "login attempt"
];

const runHeuristic = (email) => {
  const text =
    `${email.subject} ${email.body}`.toLowerCase();

  return {
    spam: spamKeywords.some(word =>
      text.includes(word)
    ),

    urgent: urgentKeywords.some(word =>
      text.includes(word)
    ),

    security: securityKeywords.some(word =>
      text.includes(word)
    ),

    internal:
      email.sender.endsWith("@internal.com") ||
      email.sender.endsWith("@mycompany.com")
  };
};

module.exports = runHeuristic;