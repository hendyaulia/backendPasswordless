require('dotenv').config();
const User = require("../models/user.model");
const auth = require("../middlewares/auth.js");
const Certs = require("./certs.services");
const otpGenerator = require("otp-generator");
const crypto = require("crypto");
const key = "TugasAkhirPasswordless"; // kuncinya
const nodemailer = require("nodemailer");
const { response } = require("express");
const fs = require('fs');


async function login({ username }, callback) {
  const user = await User.findOne({ username });

  if (user != null) {
    if ((username === user.username)) {
      const token = auth.generateAccessToken(username);
      var res = await sendOTP(user, ()=>{})
      var otpCode = res.otp;
      var otpHash = res.fullHash;
      return callback(null, { ...user.toJSON(), otpCode, otpHash, token});
    } else {
      return callback({
        message: "Invalid Username",
      });
    }
  } else {
    return callback({
      message: "Invalid Username",
    });
  }
}

async function register(params, callback) {
  if (params.username === undefined) {
    console.log(params.username);
    return callback(
      {
        message: "Username Required",
      },
      ""
    );
  }
  
  const user = new User(params);
  user
  .save()
  .then(async (response) => {
      console.log('user baru telah dibuat');
      let {certPath, keyPath} = await Certs.createCertificate(params)

      const cert = fs.readFileSync(certPath);
      const key = fs.readFileSync(keyPath);
    
      var otpMessage = `<p>Ini sertifikat dan kunci privatmu. silahkan install di device</p>`;
      const mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: params.email,
        subject: "Verifikasi Akun",
        html: `<p>${otpMessage}</p><p>Kode ini hanya berlaku selama 5 menit</p><p>Terima kasih</p><p>Administrator</p>`,
        attachments: [
          {
            filename: 'cert.pem',
            content: cert
          },
          {
            filename: 'key.pem',
            content: key
          }
        ]
      };
      await sendEmail(mailOptions);
    
      return callback(null, response);
    })
    .catch((error) => {
      return callback(error);
    });
}
let transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
      type: "login",
      user: process.env.AUTH_EMAIL,
      pass: process.env.AUTH_PASS,
  },
});

// testing success
transporter.verify((error, success) => {
if (error) {
    console.log(error);
} else {
    console.log("Ready for messages");
    console.log(success);
}
});

async function createNewOTP(params, callback) {
  // Generate a 4 digit numeric OTP
  const otp = otpGenerator.generate(6, {
    alphabets: false,
    upperCase: false,
    specialChars: false,
  });
  const ttl = 5 * 60 * 1000; //5 Minutes in miliseconds
  const expires = Date.now() + ttl; //timestamp to 5 minutes in the future
  console.log(params.email);
  const data = `${params.email}.${otp}.${expires}`; // phone.otp.expiry_timestamp
  const hash = crypto.createHmac("sha256", key).update(data).digest("hex"); // creating SHA256 hash of the data
  const fullHash = `${hash}.${expires}`; // Hash.expires, format to send to the user

  console.log(`Your OTP is ${otp}. it will expire in 5 minutes`);
  
  return {otp: otp, expires: expires, data: data, hash: hash, fullHash: fullHash};   
}

const sendEmail = async (mailOptions) => {
  try {
      await transporter.sendMail(mailOptions);
      return; 
  } catch (error) {
      throw error;
  }
};

async function sendOTP(params, callback) {
  try {
    if (!params && callback) {
      throw Error("Provide values for email, subject, message");
    }

    let res = await createNewOTP(params, () => {});

    console.log(res);

    var otpMessage = `<p>Berikut kode untuk verifikasi login Anda</p><p style="color:tomato;font-size:25px;letter-spacing:2px;"><b>${res.otp}</b> <p>Jaga kode ini dan jangan diberitahukan pada orang yang tidak berhak.</p>`;
    const mailOptions = {
      from: process.env.AUTH_EMAIL,
      to: params.email,
      subject: "Verifikasi Akun",
      html: `<p>${otpMessage}</p><p>Kode ini hanya berlaku selama 5 menit</p><p>Terima kasih</p><p>Administrator</p>`,
    };
    await sendEmail(mailOptions);
    return {...res, params};
  } catch (error) {
    throw error;
  }
}

async function verifyOTP(params, callback) {
  try {
    let [hashValue, expires] = params.hash.split(".");
    let now = Date.now();
    if (now > parseInt(expires)) {
      return callback("OTP Expired");
    }
    
    console.log(params.phone);
    let data = `${params.phone}.${params.otp}.${expires}`;
    let newCalculatedHash = crypto
      .createHmac("sha256", key)
      .update(data)
      .digest("hex");
    console.log(newCalculatedHash);
    console.log(hashValue);
    if (newCalculatedHash === hashValue) {
      return callback("Success");
    } else {
      return callback("Invalid OTP");
    }
  } catch (error) {
    throw error;
  }
}
    
module.exports = {
  sendOTP,
  sendEmail,
  login,
  register,
  createNewOTP,
  verifyOTP,
};
