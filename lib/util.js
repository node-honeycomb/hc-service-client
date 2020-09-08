'use strict';

exports.errorWrapper = function (message) {
  const err = new Error(message);
  err.code = 'HC_SERVICE_CLIENT_ERROR';

  return err;
};

/**
 * @support
 * client.get('/xxx')
 * client.get('/xxx', callback)
 * client.get('/xxx', {data})
 * client.get('/xxx', {data}, callback)
 * client.get('/xxx', {data}, timeout)
 * client.get('/xxx', {data}, timeout, callback)
 * client.get('/xxx', {data}, {options})
 * client.get('/xxx', {data}, {options}, callback)
 * @return
 * [path, data, options, callback]
 */
exports.callWrapper = function (args) {
  if (args.length === 1) {
    return [args[0], '', {}, null];
  }

  if (args.length === 2) {
    if (typeof args[1] === 'function') {
      return [args[0], '', {}, args[1]];
    } else {
      return [...args, {}, null];
    }
  }

  if (args.length === 3) {
    if (typeof args[2] === 'function') {
      return [args[0], args[1], {}, args[2]];
    } else if (typeof args[2] === 'number') {
      return [args[0], args[1], {
        timeout: args[2]
      }, null];
    } else {
      return [...args, null];
    }
  }

  if (args.length === 4) {
    if (typeof args[2] === 'number') {
      return [args[0], args[1], {
        timeout: args[2]
      }, args[3]];
    } if (typeof args[2] === 'function') {
      return [args[0], args[1], args[3], args[2]];
    } else {
      return args;
    }
  }

  return args.slice(0, 4);
};
