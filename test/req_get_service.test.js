'use strict';

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const serviceClientExtension = require('..');
const assert = require('power-assert');
const request = require('supertest');
const debug = require('debug')('hc-service-client');
const config = require('./config');

serviceClientExtension({
  config: {
    prefix: '/service_client_test',
    systemToken: config.systemToken
  },
  getLog: function () {
    return console;
  },
  express
}, config.services);

describe('#req.getService()', function () {
  before(function (done) {
    app.use(jsonParser);
    app.get('/req_get_service', function (req, res) {
      assert(typeof req.getService, 'function');
      assert(typeof req.getAppClient, 'function');
      res.end('success');
    });
    app.get('/otm_objects', function (req, res) {
      const client = req.getService('otm');
      client.get('/api/v2/objects', function (err, body) {
        res.json(body);
      });
    });
    app.get('/otm_objects_with_error', function (req, res) {
      req.session = {
        user: {
          tenant: 'dtboost',
          id: 'sss'
        }
      };
      const client = req.getService('otm');
      client.get('/api/v2/objects', function (err, body) {
        res.json(err || body);
      });
    });
    app.get('/analysis_query', function (req, res) {
      const client = req.getService();
      req.session = {
        user: {
          tenant: 'dtboost'
        }
      };
      client.post('/analysis/api/query', {
        tql: 'select user.age from user;',
        extra: {
          schemaCode: config.testSchemaCode
        },
        workspaceCode: config.testWorkspaceCode
      }, function (err, body) {
        res.json(err || body);
      });
    });
    app.get('/azk_query', function (req, res) {
      req.session = {
        user: {
          tenant: config.tenantCode,
          id: config.userId
        }
      };
      const client = req.getService('azk');
      client.get('/alg/categories', {
        scopeId: config.tenantCode,
        isPrivate: true,
        referType: 'DEFINE',
        tenant: config.tenantCode
      }, function (err, body) {
        res.json(err || body);
      });
    });
    app.listen();
    done();
  });

  it('req.getService & req.getAppClient should exist', function (done) {
    request(app).get('/req_get_service').expect(200).end(function (err, res) {
      // assert(res.text, 'success');
      done();
    });
  });

  it('test otm service', function (done) {
    request(app).get('/otm_objects').expect(200).end(function (err, res) {
      // debug('otm success', err, res.body);
      assert(res.body.data);
      done();
    });
  });

  it('test otm service error', function (done) {
    request(app).get('/otm_objects_with_error').expect(200).end(function (err, res) {
      // debug('otm error', err, res.body);
      assert(res.body.code === 'OTM_UNAUTHORIZED_OPERATION');
      done();
    });
  });

  it('test analysis service', function (done) {
    request(app).get('/analysis_query').expect(200).end(function (err, res) {
      // debug('analysis success', err, res.body);
      assert(res.body);
      done();
    });
  });

  it('test azk service', function (done) {
    request(app).get('/azk_query').expect(200).end(function (err, res) {
      // debug('azk success', err, res.body);
      assert(res.body.data);
      done();
    });
  });
});
