'use strict';

const _ = require('lodash');

module.exports = function (req, serviceCfg) {
  let user = _.get(req.session, 'user', {});
  const headers = {};
  headers['X-ScopeId']  = user.tenant || req.headers['x-xcopeid'];
  headers['X-Operator'] = user.id || req.headers['x-operator'] || '';
  headers['X-Work-App'] = serviceCfg.workApp || req.headers['x-work-app'] || '';

  return headers;
};
