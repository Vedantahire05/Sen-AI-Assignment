const mongoose = require("mongoose");

const DraftSchema =
new mongoose.Schema(
{
  emailId:{
    type:String,
    required:true,
  },

  draftText:{
    type:String,
    required:true,
  },

  status:{
    type:String,
    enum:[
      "PENDING",
      "APPROVED",
      "REJECTED"
    ],
    default:"PENDING",
  },

  approvedBy:{
    type:String,
    default:null,
  },

  approvedAt:{
    type:Date,
    default:null,
  }
},
{
  timestamps:true,
}
);

module.exports =
mongoose.model(
  "Draft",
  DraftSchema
);