const error = () => {};
const debug = () => {};

module.exports = {
  error,
  debug,
  checkResponse: require('../../util').Logger.checkResponse
};