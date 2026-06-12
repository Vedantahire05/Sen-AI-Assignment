const sendReply = async (
  email,
  reply
) => {
  return {
    sent: true,
    emailId: email._id,
    reply,
  };
};

module.exports = sendReply;