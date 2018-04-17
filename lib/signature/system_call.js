'use strict';

const crypto = require('crypto');
const debug = require('debug')('hc-service-client');

function signature(options) {
  const method = options.method || 'GET';
  const path = options.path;
  const date = options.date;
  const content = options.content;
  const accessKeyId = options.accessKeyId;
  const accessKeySecret = options.accessKeySecret;
  const log = options.log;
  const signatureHeader = options.signatureHeader;

  let contentMd5;
  let toSignStr;
  const headers = {};
  if (['POST', 'PUT', 'PATCH'].indexOf(method) >= 0) {
    contentMd5 = crypto.createHash('md5').update(content, 'utf8').digest('base64');
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

module.exports = signature;
