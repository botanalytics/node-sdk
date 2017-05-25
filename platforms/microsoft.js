module.exports = function(token, userConfig) {

  // Check token
  if (!token) {

    throw new Error('You must provide a Botanalytics token!');
  }

  // Create default config
  var config = {
    baseUrl: 'https://botanalytics.co/api/v1/',
    debug: false
  }

  // Merge user configuration into the default config
  Object.assign(config, userConfig);

  const log = new require('../util').Logger(config);

  log.debug('Logging enabled.');

  log.debug('Configuration: ' + util.inspect(config))

  // Configure request defaults
  const request = require('request').defaults({
    baseUrl: config.baseUrl,
    headers: {
      'Authorization': 'Token ' + encodeURIComponent(token),
      'Content-Type': 'application/json'
    }
  });

  return {

    receive: function(session, next) {

      log.debug('Received message.');

      request({

        url: '/messages/microsoft-bot-framework/',
        method: 'POST',
        json: true,
        body: {
          message: session,
          timestamp: new Date().getTime(),
          is_sender_bot: false
        }

      }, (err, resp, payload) => {

        if (err) {

          log.error('Failed to log incoming message.', err);

          if (callback)
            callback(new Error('Failed to log incoming message'));

          return;
        }

        err = log.checkResponse(resp, 'Successfully logged incoming message.', 'Failed to log incoming message.');

        if (err) {

          log.error('Failed to log incoming message.', err);
        }
      });
    },

    send: function(session, next) {

      log.debug('Sent message.');

      request({

        url: '/messages/microsoft-bot-framework/',
        method: 'POST',
        json: true,
        body: {
          message: session,
          timestamp: new Date().getTime(),
          is_sender_bot: true
        }

      }, (err, resp, payload) => {

        if (err) {

          log.error('Failed to log outgoing message.', err);

          if (callback)
            callback(new Error('Failed to log outgoing message'));

          return;
        }

        err = log.checkResponse(resp, 'Successfully logged outgoing message.', 'Failed to log outgoing message.');

        if (err) {

          log.error('Failed to log outgoing message.', err);
        }
      })
    }
  };
}
