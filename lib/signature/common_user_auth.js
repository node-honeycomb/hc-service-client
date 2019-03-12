'use strict';

const crypto = require('crypto');

function signature(options) {
  const method = options.method || 'GET';
  const path = options.path;
  const date = options.date;
  const content = options.content;
//   const accessKeyId = options.accessKeyId;
  const accessKeySecret = options.accessKeySecret;
  const signatureHeader = options.signatureHeader;
  const accept = options.accept || '';
  const contentType = options.contentType || 'application/json';

  let headers = {};
  const md5 = function (buffer) {
    return crypto.createHash('md5').update(buffer).digest('base64');
  };
  const sha1 = function (stringToSign, secret) {
    return crypto.createHmac('sha1', secret).update(stringToSign).digest().toString('base64');
  };
  let body = content || '';
  let bodymd5;
  if (['POST', 'PUT', 'PATCH'].indexOf(method) >= 0) {
    bodymd5 = md5(Buffer.from(body));
    headers['Content-MD5'] = bodymd5;
  } else {
    bodymd5 = '';
  }
  let stringToSign = method + '\n' + accept + '\n' + bodymd5 +
    '\n' + contentType + '\n' + date + '\n' +
    path;
  let signature = sha1(stringToSign, accessKeySecret);
  headers[signatureHeader || 'Authorization'] = `common-user-ak-v1 ${options.source} ${options.target} ${signature}`;
  return headers;
}

module.exports = signature;
