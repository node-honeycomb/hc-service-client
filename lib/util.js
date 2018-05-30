'use strict';

exports.errorWrapper = function (message) {
  const err = new Error(message);
  err.code = 'HC_SERVICE_CLIENT_ERROR';

  return err;
};

