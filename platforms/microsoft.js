const util = require('util');

var luisRecognizerRef;

module.exports = function(token, userConfig) {

  // Check token
  if (!token) {

    throw new Error('You must provide a Botanalytics token!');
  }

  // Create default config
  var config = {
    baseUrl: 'https://api.botanalytics.co/v1/',
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
      'Content-Type': 'application/json',
      'X-Botanalytics-Client-Id': 'node',
      'X-Botanalytics-Client-Version': require('../util').getVersion()
    }
  });

  function logMessage(payload, is_sender_bot) {

    log.debug((is_sender_bot ? 'Received' : 'Sent') + ' message.');

      request({

        url: '/microsoft-bot-framework/messages/',
        method: 'POST',
        json: true,
        body: payload

      }, (err, resp, payload) => {

        if (err) {

          log.error('Failed to log ' + (is_sender_bot ? 'outgoing' : 'incoming') + ' message.', err);

          if (payload.errors) {

            payload.errors.forEach((errorMsg) => log.error(errorMsg));
          }

          return;
        }

        err = log.checkResponse(resp, 'Successfully logged ' + (is_sender_bot ? 'outgoing' : 'incoming') + ' message.', 'Failed to log ' + (is_sender_bot ? 'outgoing' : 'incoming') + ' message.');

        if (err) {

          log.error('Failed to log ' + (is_sender_bot ? 'outgoing' : 'incoming') + ' message.', err);
        }
      });
  }

  return {
  
    middleware: async function(context, next) {

      if (context.activity) {

          var activity = context.activity;

          if (luisRecognizerRef) {

            var result = await luisRecognizerRef.recognize(context);

            var nluPayload = {
              'type': 'luis'
            };

            Object.assign(nluPayload, result.luisResult);

            activity.nlu_payload = nluPayload;
          }

          logMessage(activity, false);
      }

      context.onSendActivities((context, activities, innerNext) => {

        return innerNext().then((result) => {

          if (activities) {

            activities.forEach(async (activity) => {

                if (luisRecognizerRef) {
                  
                  var result = await luisRecognizerRef.recognize(context);

                  var nluPayload = {
                    'type': 'luis'
                  };

                  Object.assign(nluPayload, result.luisResult);

                  activity.nlu_payload = nluPayload;
                }

                logMessage(activity, true);
            });
          }
        });
      });

      return next();
    },

    useLuisRecognizer: function(luisRecognizer) {

      luisRecognizerRef = luisRecognizer;
    }

  };
}
