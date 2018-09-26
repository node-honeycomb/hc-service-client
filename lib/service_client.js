'use strict';

const _ = require('lodash');
const http = require('http');
const urllib = require('urllib');
const Readable = require('stream').Readable;
const url = require('url');
const debug = require('debug')('hc-service-client');
const qs = require('qs');
const util = require('./util');

class ServiceClient {
  constructor(options) {
    if (!options.endpoint && !options.endPoint) {
      throw util.errorWrapper('[hc-service-client]: endpoint is required.');
    }
    if (!options.endpoint) {
      options.endpoint = options.endPoint;
    }
    if (!options.accessKeySecret) {
      throw util.errorWrapper('[hc-service-client]: accessKeySecret is required.');
    }
    this.rid = options.rid;                                                                     // rid
    this.remoteApp = options.remoteApp || 'service-client';                                     // remoteApp
    this.endpoint = options.endpoint;                                                           // 远程调用地址
    this.accessKeyId = options.accessKeyId || 'anonymous';                                      // 签名的Id
    this.accessKeySecret = options.accessKeySecret;                                             // 签名的Secret
    this.signatureApproach = options.signatureApproach || 'systemCall';                             // 签名方法名
    this.signatureProcessor = this.signatureApproach === 'userAuth' ? require('./signature/user_auth') : require('./signature/system_call');  // 签名处理方法
    this.timeout = options.timeout || 60000;                                                    // 请求超时，默认60秒
    this.httpAgent = new http.Agent({                                                           // httpAgent
      keepAlive: true,
      keepAliveMsecs: options.keepAliveMsecs  // default 1000ms
    });
    this.log = options.log || console;                                                          // log
    this.signatureHeader = options.signatureHeader;
    if (!this.log.debug) {
      this.log.debug = this.log.log;
    }
    if (!this.log.debug) {
      throw util.errorWrapper('[hc-service-client]: `log` instance should have debug function.');
    }
    this.disableFileSignature = options.disableFileSignature;                                   // 禁用文件签名
    this.headers = options.headers || {};                                                       // 默认发送的headers
    this.responseWrapper = typeof options.responseWrapper === 'function' ? options.responseWrapper :
      (data) => {
        if (!data) {
          return data;
        }

        if (data.code !== 'SUCCESS') {
          const err = new Error(data.message || 'empty error message');
          Object.assign(err, data);
          return err;
        }

        return data.data;
      };
  }

  getHref(path) {
    const endpointUrlMeta = url.parse(this.endpoint);
    const requestPathUrlMeta = url.parse(path);

    const protocol = requestPathUrlMeta.protocol || endpointUrlMeta.protocol || 'http:';
    const host = requestPathUrlMeta.host || endpointUrlMeta.host || 'localhost';
    let basePathname = endpointUrlMeta.pathname;
    let requestPath = requestPathUrlMeta.path || '';
    if (requestPath && !_.endsWith(basePathname, '/')) {
      basePathname += '/';
    }
    if (_.startsWith(requestPath, '/')) {
      requestPath = requestPath.slice(1);
    }

    const result = protocol + '//' + host + url.resolve(basePathname, requestPath);

    if (requestPathUrlMeta.protocol) {
      return path;
    } else {
      return result;
    }
  }

  getPath(path, options) {
    const endpointUrlMeta = url.parse(this.endpoint);
    let endpointPathName = endpointUrlMeta.pathname;
    const requestPathUrlMeta = url.parse(path);
    let requestPath = requestPathUrlMeta.path || '';

    if (requestPath && !_.endsWith(endpointPathName, '/')) {
      endpointPathName += '/';
    }

    if (_.startsWith(requestPath, '/')) {
      requestPath = requestPath.slice(1);
    }

    if (['POST', 'PUT', 'PATCH'].indexOf(options.method) === -1 && options.data) {
      let queryString = qs.stringify(options.data);
      if (queryString) {
        if (requestPathUrlMeta.search) {
          requestPath += '&' + queryString;
        } else {
          requestPath += '?' + queryString;
        }
      }
    }

    const resultPath = url.resolve(endpointPathName, requestPath);
    if (requestPathUrlMeta.protocol) {
      return '/' + requestPath;
    } else {
      return resultPath;
    }
  }

  request(path, options, callback) {
    let headers = options.headers;
    let signatureHeader = this.signatureHeader;

    // set `nestedQuerystring` to true if it's null or undefined. see https://github.com/node-modules/urllib/tree/677e2ef90b3c0e0f26889696ca6eb88e2c4f5ded#arguments
    options.nestedQuerystring = _.isNil(options.nestedQuerystring) ? true : !!options.nestedQuerystring;

    // get data content from stream promise
    const getSteamData = new Promise(function (resolve) {
      const chuncks = [];
      if (options.stream) {
        const myReadStream = new Readable({
          read: function () {
          }
        });
        options.stream.on('end', function () {
          const streamData = Buffer.concat(chuncks);
          options.stream = myReadStream;
          resolve(streamData);
        });
        options.stream.on('data', function (chunck) {
          chuncks.push(chunck);
          myReadStream.push(chunck, 'utf8');
          return chunck;
        });
      } else {
        resolve();
      }
    });

    const result = getSteamData.then((streamData) => {
      if (this.disableFileSignature) {
        streamData = undefined;
      }
      let cnt;
      options.data = options.data ? options.data : '';
      switch (typeof options.data) {
        case 'string':
          cnt = options.data;
          break;
        case 'object':
          cnt = JSON.stringify(options.data);
          break;
        default:
          cnt = '';
      }
      if (streamData && streamData.length) {
        cnt = streamData;
      }

      headers = Object.assign({}, this.headers, headers);
      const method = options.method;
      const accept = options.dataType === 'json' ? 'application/json' : headers['accept'];
      const contentType = headers['Content-Type'] || headers['content-type'];
      const resultPath = this.getPath(path, options);
      const date = new Date().toUTCString();

      const signatureOption = {
        method,
        accept,
        contentType,
        path: resultPath,
        date,
        content: cnt,
        accessKeyId: this.accessKeyId,
        accessKeySecret: this.accessKeySecret,
        log: this.log,
        signatureHeader
      };

      headers.Date = date;
      Object.assign(headers, this.signatureProcessor(signatureOption));

      options.headers = headers;
      this.log.debug('request headers: ', options.headers);
      options.agent = this.keepAliveAgent;

      let href = this.getHref(path, options);
      debug('request url: ', href, options);
      this.log.debug('request url: ', href);

      let cb = undefined;
      if (callback) {
        cb = (err, body, res) => {
          if (err) {
            this.log.debug('request got error: ', err);
            return callback(err);
          }

          const processedData = this.responseWrapper(body);
          if (processedData instanceof Error) {
            this.log.debug('request got error with responseWrapper: ', processedData);
            return callback(processedData);
          }

          if (res instanceof http.IncomingMessage) {
            this.log.debug('request got result with http.IncomingMessage.');
            callback(null, processedData, res);
          } else {
            this.log.debug('request got result without http.IncomingMessage.');
            callback(null, processedData, res);
          }
        };
      }

      return urllib.request(href, options, cb);
    });

    if (callback) {
      return undefined;
    } else {
      return result.then(d => {
        const body = d.data;
        const res = d.res;

        const processedData = this.responseWrapper(body);
        if (processedData instanceof Error) {
          this.log.debug('promise request got error: ', processedData);
          throw processedData;
        }

        if (res instanceof http.IncomingMessage) {
          this.log.debug('promise request return result with http.IncomingMessage.');
          return {
            data: processedData,
            res
          };
        } else {
          this.log.debug('promise request return result without http.IncomingMessage.');
          return processedData;
        }
      });
    }
  }

  get() {
    let [path, data, opt, callback] = util.callWrapper(arguments);
    let options = {
      method: 'GET',
      data,
      dataType: 'json',
      timeout: this.timeout || 60000
    };
    _.merge(options, opt);
    return this.request(path, options, callback);
  }

  post() {
    let [path, data, opt, callback] = util.callWrapper(arguments);
    let options = {
      method: 'POST',
      contentType: 'json',
      data,
      dataType: 'json',
      timeout: this.timeout || 60000
    };
    _.merge(options, opt);
    return this.request(path, options, callback);
  }

  delete() {
    let [path, data, opt, callback] = util.callWrapper(arguments);
    let options = {
      method: 'DELETE',
      dataType: 'json',
      contentType: 'json',
      data,
      timeout: this.timeout || 60000
    };
    _.merge(options, opt);
    return this.request(path, options, callback);
  }

  put() {
    let [path, data, opt, callback] = util.callWrapper(arguments);
    let options = {
      method: 'PUT',
      contentType: 'json',
      data,
      dataType: 'json',
      timeout: this.timeout || 60000
    };
    _.merge(options, opt);
    return this.request(path, options, callback);
  }
}

module.exports = ServiceClient;
