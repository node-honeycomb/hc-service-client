'use strict';

const _ = require('lodash');

module.exports = function (req) {
  const headers = {};

  let user = _.get(req.session, 'user', {});
  let query = req.query || {};
  let workspaceId = req.headers['x-access-workspaceid'];
  if (!workspaceId) {
    if (['GET', 'DELETE', 'OPTIONS'].indexOf(req.method) !== -1) {
      workspaceId = _.get(user, 'workspaces.' + _.get(req.query, 'workspaceCode'), '');
    } else {
      workspaceId = _.get(user, 'workspaces.' + _.get(req.body, 'workspaceCode'), '');
    }
  }
  headers['X-Access-TenantCode']  = user.tenant || req.headers['x-access-tenantcode'] || req.headers['x-access-tenant'] || req.headers['x-dataplus-org-code'] || query.tenant || '';
  headers['X-Access-UserId']      = user.id || req.headers['x-access-userid'] || '';
  headers['X-Access-WorkspaceId'] = workspaceId || '';

  return headers;
};
