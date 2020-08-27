'use strict';

const crypto = require('crypto');

function sha1(stringToSign, secret) {
  return crypto.createHmac('sha1', secret).update(stringToSign).digest().toString('base64');
};

class Signature {
  constructor(options) {
    this.options = options;
    this.md5 = crypto.createHash('md5');
  }
  update(buf) {
    this.md5.update(buf);
  }
  end() {
    let options = this.options;
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
    let body = content || '';
    let bodymd5;
    if (['POST', 'PUT', 'PATCH'].indexOf(method) >= 0) {
      bodymd5 = this.md5.digest('base64');;
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
};

function signature(options) {
  let sign = new Signature(options);
  if (options.content !== undefined) {
    sign.update(content);
    return sign.end();
  } else {
    return sign;
  }
}

module.exports = signature;
