const express =
require("express");

const router =
express.Router();

const getContactProfile =
require("../tools/getContactProfile");

const checkAccountStatus =
require("../tools/checkAccountStatus");

router.get(
  "/contact/:email",
  async (req,res)=>{

    const result =
    await getContactProfile(
      req.params.email
    );

    res.json(result);
  }
);

router.get(
  "/account/:email",
  async (req,res)=>{

    const result =
    await checkAccountStatus(
      req.params.email
    );

    res.json(result);
  }
);

const flagForLegal =
require("../tools/flagForLegal");

router.post(
  "/legal/:emailId",
  async (req,res)=>{

    const result =
    await flagForLegal(
      req.params.emailId,
      "Legal Escalation"
    );

    res.json(result);
  }
);

module.exports =
router;