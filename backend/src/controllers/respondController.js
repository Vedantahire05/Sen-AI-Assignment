const Email =
require("../models/Email");

const Draft =
require("../models/Draft");

const Contact =
require("../models/Contact");

const draftReply =
require("../tools/draftReply");

const respond =
async (req,res)=>{

  try {

    const email =
      await Email.findById(
        req.params.emailId
      );

    if(!email){
      return res.status(404).json({
        success:false,
        message:"Email not found"
      });
    }

    const contact =
      await Contact.findOne({
        email: email.sender
      });

    const draftText =
      await draftReply(
        email,
        {
          category:
            email.category,
          suggested_reply:
            email.suggestedReply
        },
        contact
      );

    const draft =
      await Draft.create({
        emailId:
          email._id.toString(),
        draftText,
      });

    return res.json({
      success:true,
      draft,
    });

  } catch(error){

    return res.status(500).json({
      success:false,
      message:error.message
    });

  }
};

module.exports = {
  respond,
};