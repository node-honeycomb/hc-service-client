'use strict';

const _ = require('lodash');
const ServiceClient = require('./lib/service_client');
const util = require('./lib/util');

module.exports = function (app, config) {
  config = config || {};

  let req = app.express.request;
  let log = app.getLog();
  let ridHeader = config && config.ridHeader || 'eagleeye-traceid';
  let disableFileSignature = config.disableFileSignature || false;
  if (ridHeader && typeof ridHeader !== 'string') {
    throw util.errorWrapper('[service-client]: ridHeader should be an string');
  }

  req.getService = function (serviceCode) {
    serviceCode = serviceCode || 'dtboost';
    let serviceCfg = config && config[serviceCode] || app.config.services && app.config.services[serviceCode];
    if (!serviceCfg) {
      log.error('the service config: ', app.config.services);
      throw util.errorWrapper(`[service-client]: Can not find ${serviceCode}'s service config.`);
    }

    let option = {};
    if (serviceCfg && typeof serviceCfg === 'object') {
      option = _.cloneDeep(serviceCfg);
    }
    if (typeof serviceCfg === 'string') {
      option.endpoint =  serviceCfg;
      option.accessKeyId = 'anonymous';
      option.accessKeySecret = app.config.systemToken;
    } else {
      option.endpoint =  serviceCfg.endpoint || serviceCfg.endPoint;
      option.accessKeyId = serviceCfg.accessKeyId || 'anonymous';
      option.accessKeySecret = serviceCfg.accessKeySecret || serviceCfg.token || app.config.systemToken;
    }
    if (this.headers[ridHeader.toLowerCase()]) {
      option.rid = this.headers[ridHeader.toLowerCase()];
    }
    option.remoteApp = app.config.prefix;
    option.timeout = serviceCfg.timeout;
    option.signatureApproach = serviceCfg.signatureApproach;
    option.headerExtension = serviceCfg.headerExtension || serviceCfg.extension || serviceCfg.beforeRequest || [];
    option.disableFileSignature = disableFileSignature;
    option.log = log;
    option.headers = Object.assign({}, calculateHeaderExtension(this, option), serviceCfg.headers);
    option.responseWrapper = serviceCfg.responseWrapper;

    return new ServiceClient(option);
  };

  req.getAppClient = req.getService;
};

function calculateHeaderExtension(req, serviceCfg) {
  const headers = {};
  if (serviceCfg.remoteApp) {
    headers['X-Remote-App'] = serviceCfg.remoteApp;
  }
  if (serviceCfg.rid) {
    headers['EagleEye-TraceId'] = serviceCfg.rid;
  }

  serviceCfg.headerExtension.forEach(e => {
    // 1. 如果是函数，直接执行
    // 2. 如果是string，加载内置的模块
    // 3. 如果是object，merge到headers
    if (typeof e === 'function') {
      Object.assign(headers, e(req, serviceCfg));
    } else if (typeof e === 'string') {
      try {
        const m = require('./lib/extension/' + e);
        Object.assign(headers, m(req, serviceCfg));
      } catch (e) {
        serviceCfg.log.error(e);
      }
    } else if (e && typeof e === 'object') {
      Object.assign(headers, e);
    }
  });

  return headers;
}

module.exports.ServiceClient = ServiceClient;

