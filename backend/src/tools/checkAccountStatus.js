const Contact =
require("../models/Contact");

const checkAccountStatus =
async (email) => {

  const contact =
    await Contact.findOne({
      email,
    });

  if (!contact) {
    return null;
  }

  return {
    tier:
      contact.subscriptionTier,

    status:
      contact.status,

    accountValue:
      contact.accountValue,

    churnRisk:
      contact.churnRiskScore,

    openTickets:
      contact.openTickets,
  };
};

module.exports =
  checkAccountStatus;