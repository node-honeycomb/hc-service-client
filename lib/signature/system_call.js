'use strict';

const crypto = require('crypto');
const debug = require('debug')('hc-service-client');

class Signature {
  constructor(options) {
    this.options = options;
    this.md5 = crypto.createHash('md5');
  }
  update(buf) {
    if (this.options.disableBodySign) {
      return;
    }
    this.md5.update(buf, 'utf8');
  }
  end() {
    let options = this.options;
    const method = options.method || 'GET';
    const path = options.path;
    const date = options.date;
    const content = options.content;
    const accessKeyId = options.accessKeyId;
    const accessKeySecret = options.accessKeySecret;
    const log = options.log;
    const signatureHeader = options.signatureHeader;
    const disableBodySign = options.disableBodySign;

    let contentMd5;
    let toSignStr;
    const headers = {};
    if (!disableBodySign && ['POST', 'PUT', 'PATCH'].indexOf(method) >= 0) {
      contentMd5 = this.md5.digest('base64');
      toSignStr = `${method}\n${path}\n${date}\n${contentMd5}`;
      headers['Content-MD5'] = contentMd5;
      log.debug('request post body: ', options.data);
    } else {
      toSignStr = `${method}\n${path}\n${date}`;
      options.data = {};
    }
    debug('beSignStr: ', toSignStr);
    log.debug('beSignStr: ', toSignStr);
    let signature = crypto.createHmac('sha1', accessKeySecret).update(toSignStr, 'utf8').digest('base64');

    headers[signatureHeader || 'signature'] = `honeybee ${accessKeyId}:${signature}`;
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
