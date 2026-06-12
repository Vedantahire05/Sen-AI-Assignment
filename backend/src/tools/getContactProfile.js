const Contact =
require("../models/Contact");

const getContactProfile =
async (email) => {

  const contact =
    await Contact.findOne({
      email,
    });

  return contact;
};

module.exports =
  getContactProfile;