const certsServices = require("../services/certs.services");

exports.verifyCert = (req, res, next) => {
  const certHeader = req.headers['certificate']
  console.log('Autentikasi sertifikat berhasil');
  if (!certHeader) {
    return res.status(401).send('No certs')
  }
  const cert = Buffer.from(certHeader, 'base64').toString();
  certsServices.verifyCert(cert, (error, results) => {
    if (error) {
      console.log(error);
      return res.status(401).send('Invalid certs')
    }

    next()
  });
};