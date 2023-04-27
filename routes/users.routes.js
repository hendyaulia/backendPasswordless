const usersController = require("../controllers/user.controller");
const nodemailer = require("nodemailer");
const cersMiddleware = require("../middlewares/certs.js");

const express = require("express");
const router = express.Router();

router.post("/register", usersController.register);
router.post("/login",[cersMiddleware.verifyCert] , usersController.login);
router.get("/user-Profile",[cersMiddleware.verifyCert] , usersController.userProfile);
router.post("/otpLogin",[cersMiddleware.verifyCert] , usersController.otpLogin);
router.post("/otpVerify",[cersMiddleware.verifyCert] , usersController.verifyOTP);

module.exports = router;