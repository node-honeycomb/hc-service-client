'use strict';

const crypto = require('crypto');
const _ = require('lodash');
const Url = require('url');

function sha1(stringToSign, secret) {
  return crypto.createHmac('sha1', secret).update(stringToSign).digest().toString('base64');
}

class Signature {
  constructor(options) {
    this.options = options;
    this.md5 = crypto.createHash('md5');
  }
  update(buf) {
    this.md5.update(buf);
  }
  end(date) {
    let options = this.options;
    const method = options.method || 'GET';
    const path = options.path;
    const content = options.data;

    let body = content || {};
    let bodymd5 = '';
    let headers = {};
    if (body && _.size(body) && ['POST', 'PUT', 'PATCH'].indexOf(method.toUpperCase()) >= 0) {
      bodymd5 = crypto.createHash('md5').update(Buffer.from(JSON.stringify(body))).digest('base64');
      headers['Content-MD5'] = bodymd5;
    }
    let stringToSign = method + '\n' + Url.parse(path).path + '\n' + date;
    if (bodymd5) {
      stringToSign = stringToSign + '\n' + bodymd5;
    }
    let signature = sha1(stringToSign, this.options.accessKeySecret);
    headers[this.options.signatureHeader || 'signature'] = `common-user-ak-v1 ${this.options.accessKeyId}:${signature}`;
    return headers;
  }
}

function signature(options) {
  let sign = new Signature(options);
  if (options.content !== undefined) {
    sign.update(options.content);
    return sign.end();
  } else {
    return sign;
  }
}

module.exports = signature;
