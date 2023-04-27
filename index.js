const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dbConfig = require("./config/db.config");

const auth = require("./middlewares/auth.js");
const errors = require("./middlewares/errors.js");
const unless = require("express-unless");
const bodyParser = require('body-parser');
// connect to mongodb

mongoose.Promise = global.Promise;
mongoose
  .connect(dbConfig.db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(
    () => {
      console.log("Database tersambung");
    },
    (error) => {
      console.log("Database gagal tersambung: " + error);
    }
  );

// middleware for authenticating token submitted with requests
/**
 * Conditionally skip a middleware when a condition is met.
 */
auth.authenticateToken.unless = unless;
app.use(
  auth.authenticateToken.unless({
    path: [
      { url: "/users/login", methods: ["POST"] },
      { url: "/users/register", methods: ["POST"] },
      { url: "/users/otpLogin", methods: ["POST"] },
      { url: "/users/otpVerify", methods: ["POST"] },
      { url: "/certs/verifyCert", methods: ["POST"] },
    ],
  })
);

app.use(express.json());
app.use(bodyParser.text());

// initialize routes
app.use("/users", require("./routes/users.routes"));
app.use("/certs", require("./routes/certs.routes"));

// middleware for error responses
app.use(errors.errorHandler);

// listen for requests
app.listen(process.env.port || 4000, function () {
  console.log("Server berjalan pada port 4000");
});
