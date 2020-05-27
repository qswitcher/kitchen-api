const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
const jwkToPem = require('jwk-to-pem');
const { promisify } = require('util');

const cognitoPoolId = process.env.COGNITO_POOL_ID;
if (!cognitoPoolId) {
  throw new Error('env var required for cognito pool');
}
const cognitoIssuer = `https://cognito-idp.us-east-1.amazonaws.com/${cognitoPoolId}`;

let cacheKeys;
const getPublicKeys = async () => {
  if (!cacheKeys) {
    const url = `${cognitoIssuer}/.well-known/jwks.json`;
    const publicKeys = await (await fetch(url)).json();
    cacheKeys = publicKeys.keys.reduce((agg, current) => {
      const pem = jwkToPem(current);
      agg[current.kid] = { instance: current, pem };
      return agg;
    }, {});
    return cacheKeys;
  } else {
    return cacheKeys;
  }
};

const verifyPromised = promisify(jwt.verify.bind(jwt));

const verify = async (authHeader) => {
  // verify token
  const token = authHeader.replace('Bearer ', '');

  const tokenSections = (token || '').split('.');
  if (tokenSections.length < 2) {
    throw new Error('requested token is invalid');
  }
  const headerJSON = Buffer.from(tokenSections[0], 'base64').toString('utf8');
  const header = JSON.parse(headerJSON);
  const keys = await getPublicKeys();
  const key = keys[header.kid];
  if (key === undefined) {
    throw new Error('claim made for unknown kid');
  }
  const claim = await verifyPromised(token, key.pem);
  const currentSeconds = Math.floor(new Date().valueOf() / 1000);
  if (currentSeconds > claim.exp || currentSeconds < claim.auth_time) {
    throw new Error('claim is expired or invalid');
  }
  if (claim.iss !== cognitoIssuer) {
    throw new Error('claim issuer is invalid');
  }
  if (claim.token_use !== 'access') {
    throw new Error('claim use is not access');
  }
  return claim;
};

module.exports = verify;
