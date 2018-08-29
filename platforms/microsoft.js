module.exports = function(token, userConfig) {

  // Check token
  if (!token)
    throw new Error('You must provide a Botanalytics token!');


  // Create default config
  let config = {
    baseUrl: 'https://api.botanalytics.co/v1/',
    debug: false
  };

  // Merge user configuration into the default config
  Object.assign(config, userConfig);

  const log = new require('../util').Logger(config);

  log.debug('Logging enabled.');

  log.debug('Configuration: ' + require('util').inspect(config));

  // Configure request defaults
  const request = require('request').defaults({
    baseUrl: config.baseUrl,
    headers: {
      'Authorization': 'Token ' + encodeURIComponent(token),
      'Content-Type': 'application/json'
    }
  });

  return {

    botbuilder: function(session, next) {

      log.debug(`Received message:\n ${JSON.stringify(session.message)}`);

      request({

        url: '/messages/microsoft-bot-framework/',
        method: 'POST',
        json: true,
        body: {
          message: session.message,
          timestamp: new Date().getTime(),
          is_sender_bot: false
        }

      }, (err, resp) => {

        if (err) {

          log.error('Failed to log incoming message.', err);
          return;
        }

        err = log.checkResponse(resp, 'Successfully logged incoming message.', 'Failed to log incoming message.');

        if (err)
          log.error('Failed to log incoming message.', err);

      });
      next();
    },

    send: function(event, next) {

      log.debug(`Sent message:\n ${JSON.stringify(event)}`);

      request({

        url: '/messages/microsoft-bot-framework/',
        method: 'POST',
        json: true,
        body: {
          message: event,
          timestamp: new Date().getTime(),
          is_sender_bot: true
        }

      }, (err, resp) => {

        if (err) {

          log.error('Failed to log outgoing message.', err);
          return;
        }

        err = log.checkResponse(resp, 'Successfully logged outgoing message.', 'Failed to log outgoing message.');
        if (err)
          log.error('Failed to log outgoing message.', err);

      });
      next();
    }
  };
};
