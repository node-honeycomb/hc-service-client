'use strict';

const ServiceClient = require('../').ServiceClient;
const config = require('./config');
const services = config.services;
const debug = require('debug')('hc-service-client');
const assert = require('power-assert');
const formstream = require('formstream');

describe('#new ServiceClient()', function () {
  it('otm api success', function (done) {
    const client = new ServiceClient({
      endpoint: services.otm.endpoint,
      accessKeySecret: config.systemToken
    });
    client.get('/api/v2/objects', function (err, body) {
      // debug('otm service success', err, body);
      assert(body);
      done();
    });
  });

  it('test otm service error', function (done) {
    const client = new ServiceClient({
      endpoint: services.otm.endpoint,
      accessKeySecret: config.systemToken,
      headers: {
        'EagleEye-TraceId': '123456',
        'X-AccessCode-TenantCode': config.tenantCode,
        'X-AccessCode-workspaceId': '111111'
      },
    });
    client.get('/api/v2/tags', function (err) {
      // debug('otm service error', err, body);
      assert(err && err.rid);
      done();
    });
  });

  it('test analysis service', function (done) {
    const client = new ServiceClient({
      endpoint: services.dtboost.endpoint,
      accessKeyId: 'dtboost-system',
      accessKeySecret: config.systemToken,
      headers: {
        'EagleEye-TraceId': '123456',
        'X-Access-TenantCode': config.tenantCode
      }
    });
    client.post('/analysis/api/query', {
      tql: 'select user.age from user;',
      extra: {
        schemaCode: config.testSchemaCode
      },
      workspaceCode: config.testWorkspaceCode
    }, function (err, body) {
      // debug('analysis service success', err, body);
      assert(body);
      done();
    });
  });

  it('test azk service', function (done) {
    const client = new ServiceClient({
      endpoint: services.azk.endpoint,
      accessKeyId: config.accessKeyId,
      accessKeySecret: services.azk.accessKeySecret,
      headers: {
        'EagleEye-TraceId': '123456',
        'X-ScopeId': config.tenantCode,
        'X-Operator': config.userId,
        'X-Work-App': config.workApp
      }
    });
    client.get('/alg/categories', {
      scopeId: 'dtboost',
      isPrivate: true,
      referType: 'DEFINE',
      tenant: config.tenantCode
    }, function (err, body) {
      // debug('azk service success', err, body);
      assert(body);
      done();
    });
  });

  it('test azk service with href', function (done) {
    const client = new ServiceClient({
      endpoint: services.azk.endpoint + '/alg',
      accessKeyId: config.accessKeyId,
      accessKeySecret: services.azk.accessKeySecret,
      headers: {
        'EagleEye-TraceId': '123456',
        'X-ScopeId': config.tenantCode,
        'X-Operator': config.userId,
        'X-Work-App': config.workApp
      }
    });
    client.get(services.azk.endpoint + '/alg/categories', {
      scopeId: config.tenantCode,
      isPrivate: true,
      referType: 'DEFINE',
      tenant: config.tenantCode
    }, function (err, body) {
      // debug('request with href', err, body);
      assert(body);
      done();
    });
  });

  it('test azk upload file should be success', function (done) {
    const form = formstream();
    const buffer = require('fs').readFileSync('./test/service_client_unit.test.js');
    form.buffer('file', buffer, 'service_client_unit.test.js');
    form.field('foo', 'bar');
    form.field('platform', 'ODPS');
    form.field('sourceType', 'JAR');
    form.field('name', 'hello.jar');
    form.field('description', 'hc-proxy test');
    form.field('scopeId', config.tenantCode);
    const headers = form.headers({
      'EagleEye-TraceId': '123456',
      'X-ScopeId': config.tenantCode,
      'X-Operator': config.userId,
      'X-Work-App': config.workApp
    });

    new ServiceClient({
      endpoint: services.azk.endpoint,
      accessKeyId: config.accessKeyId,
      accessKeySecret: services.azk.accessKeySecret,
    }).post('/common/resource/add', '', {
      headers,
      stream: form
    }, function (err, data) {
      debug('err, data', err, data);
      done();
      assert(err.toString() === 'main.test.js');
    });
  });

  it('request asf-admin upload file should success', function (done) {
    const form = formstream();
    const buffer = new Buffer(5 * 1024);
    form.buffer('file', buffer, 'service_client_unit.test.js');
    form.field('foo', 'bar');
    form.field('platform', 'ODPS');
    form.field('sourceType', 'JAR');
    form.field('name', 'hello.jar');
    form.field('description', 'hc-proxy test');
    form.field('scopeId', config.tenantCode);
    form.field('resourceId', '123456');
    const headers = form.headers({
      'EagleEye-TraceId': '123456',
      'X-ScopeId': config.tenantCode,
      'X-Operator': config.userId,
      'X-Work-App': config.workApp
    });

    new ServiceClient({
      endpoint: services.dtboost.endpoint,
      accessKeyId: config.accessKeyId,
      accessKeySecret: services.azk.accessKeySecret,
    }).post('http://localhost:8007/asf-admin/api/alg/res', '', {
      headers,
      stream: form
    }, function (err, data) {
      debug('err, data', err, data);
      done();
      assert(err.toString() === 'main.test.js');
    });
  });

  it('test daily service with userAuth signature approach GET method.', function (done) {
    const client = new ServiceClient({
      endPoint: services.dailyUserAuth.endpoint,
      accessKeyId: services.dailyUserAuth.accessKeyId,
      accessKeySecret: services.dailyUserAuth.accessKeySecret,
      signatureApproach: 'userAuth'
    });
    client.get('/service/otm/api/v2/categories', function (err, body) {
      debug('request with href', err, body);
      assert(!err);
      done();
    });
  });

  it('test daily service with userAuth signature approach POST method.', function (done) {
    const client = new ServiceClient({
      endPoint: services.dailyUserAuth.endpoint,
      accessKeyId: services.dailyUserAuth.accessKeyId,
      accessKeySecret: services.dailyUserAuth.accessKeySecret,
      signatureApproach: 'userAuth'
    });
    client.post('/service/otm/api/v2/objects', {}, function (err) {
      debug(arguments);
      assert(err);
      assert(err.code = 'OTM_ILLEGAL_PARAMETER');
      done();
    });
  });

  it('urllib should use qs to stringify querystring.', function (done) {
    const client = new ServiceClient({
      endpoint: services.azk.endpoint,
      accessKeyId: config.accessKeyId,
      accessKeySecret: services.azk.accessKeySecret,
      headers: {
        'EagleEye-TraceId': '123456',
        'X-ScopeId': config.tenantCode,
        'X-Operator': config.userId,
        'X-Work-App': config.workApp
      }
    });
    client.get('/alg/categories', {
      scopeId: 'dtboost',
      isPrivate: true,
      referType: 'DEFINE',
      tenant: config.tenantCode,
      a: [1, 2, 3]
    }, function (err, body) {
      // debug('azk service success', err, body);
      assert(body);
      done();
    });
  });

  it('urllib should use querystring to signature occur error.', function (done) {
    const client = new ServiceClient({
      endpoint: services.azk.endpoint,
      accessKeyId: config.accessKeyId,
      accessKeySecret: services.azk.accessKeySecret,
      headers: {
        'EagleEye-TraceId': '123456',
        'X-ScopeId': config.tenantCode,
        'X-Operator': config.userId,
        'X-Work-App': config.workApp
      }
    });
    client.get('/alg/categories', {
      scopeId: 'dtboost',
      isPrivate: true,
      referType: 'DEFINE',
      tenant: config.tenantCode,
      a: [1, 2, 3]
    }, {
      nestedQuerystring: false
    }, function (err, body) {
      // debug('azk service error', err, body);
      assert(err.code, 'AZK-AUTHC-ERROR');
      done();
    });
  });
});
