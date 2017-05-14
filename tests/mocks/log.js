const error = () => {};
const debug = () => {};
const logger = new require('../../util').Logger({});

module.exports = {
  error,
  debug,
  checkResponse: logger.checkResponse
};