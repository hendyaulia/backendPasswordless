const certsServices = require("../services/certs.services");

exports.verifyCert = (req, res, next) => {
  console.log(req);
  certsServices.verifyCert(req.body, (error, results) => {
    if (error) {
      return next(error);
    }

    return res.status(200).send({
      message: "Success",
      data: results,
    });
  });
};
