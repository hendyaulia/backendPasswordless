const certsController = require("../controllers/certs.controller");
const nodemailer = require("nodemailer");

const express = require("express");
const router = express.Router();

router.post("/verifyCert", certsController.verifyCert);

module.exports = router;