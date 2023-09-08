const forge = require('node-forge');
const fs = require('fs');

// Generate a new key pair for the certificate
exports.createCertificate = async (user) => {
    // console.log('user');
    // console.log(user);
    const rootCert = fs.readFileSync(`${__dirname}/../certs/root-cert.pem`, 'utf-8');
    const rootKey = fs.readFileSync(`${__dirname}/../certs/root-key.pem`, 'utf-8');

    // Generate a new key pair for the certificate
    const keys = forge.pki.rsa.generateKeyPair(2048);
    // console.log('keys');
    // console.log(keys);

    // Create a new certificate
    const cert = forge.pki.createCertificate();
    // console.log('cert');
    // console.log(cert);
    cert.publicKey = keys.publicKey;

    // Set the subject of the certificate
    const attrs = [{
        name: 'commonName',
        value: user.username
    }];
    cert.setSubject(attrs);

    // Set the issuer of the certificate to the root certificate's subject
    const rootCertObj = forge.pki.certificateFromPem(rootCert);
    const issuer = rootCertObj.subject;
    cert.setIssuer(issuer);
    cert.issuer = issuer;

    // Set the certificate's validity period
    const now = new Date();
    const expiry = new Date();
    expiry.setFullYear(now.getFullYear() + 1);
    cert.validity.notBefore = now;
    cert.validity.notAfter = expiry;

    // Add the extensions to the certificate
    const extensions = [{
    name: 'basicConstraints',
    cA: false
    }, {
    name: 'keyUsage',
    digitalSignature: true,
    keyEncipherment: true,
    dataEncipherment: true,
    keyAgreement: true,
    keyCertSign: false,
    cRLSign: false,
    decipherOnly: false,
    encipherOnly: false
    }, {
    name: 'subjectAltName',
    altNames: [{
        type: 2, // DNS name
        value: 'example.com'
    }]
    }];
    cert.setExtensions(extensions);

    // Sign the certificate with the root key
    cert.sign(forge.pki.privateKeyFromPem(rootKey), forge.md.sha256.create());

    // Output the certificate and private key to files
    fs.writeFileSync(`${__dirname}/../certs/${user.username}-cert.pem`, forge.pki.certificateToPem(cert));
    fs.writeFileSync(`${__dirname}/../certs/${user.username}-key.pem`, forge.pki.privateKeyToPem(keys.privateKey));

    return {
        certPath: `${__dirname}/../certs/${user.username}-cert.pem`,
        keyPath: `${__dirname}/../certs/${user.username}-key.pem`
    }
}

exports.verifyCert = (params, callback) => {
    try {
        const rootCertPem = fs.readFileSync(`${__dirname}/../certs/root-cert.pem`, 'utf8');
        const rootCert = forge.pki.certificateFromPem(rootCertPem);
        // console.log('rootCert');
        // console.log(rootCert);

        const certPem = params;
        const cert = forge.pki.certificateFromPem(certPem);
        // console.log('cert');
        // console.log(cert);

        let verified = false
        try {
            verified = rootCert.verify(cert);
            // const verified = forge.pki.verifyCertificateChain(rootCert, [cert]);
        } catch (error) {
            console.log(error);
            verified = false            
        }
        // console.log('verified');
        // console.log(verified);

        if (verified) {
            return callback(null, "Success");
        } else {
            return callback("Invalid Cert");
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
  }