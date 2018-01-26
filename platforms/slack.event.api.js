'use strict';
const util = require('util');
module.exports = function (token, userConfig) {
    // Check token
    if (!token) {

        throw new Error('You must provide a Botanalytics token!');
    }

    // Create default config
    const config = {
        baseUrl: 'https://api.botanalytics.co/v1/',
        debug: false
    };
    // Merge user configuration into the default config
    Object.assign(config, userConfig);

    const log = new require('../../util').Logger(config);
    log.debug('Logging enabled.');
    log.debug('Configuration: ' + util.inspect(config));

    // Configure request defaults
    const request = require('request').defaults({
        baseUrl: config.baseUrl,
        headers: {
            'Authorization': 'Token ' + encodeURIComponent(token),
            'Content-Type': 'application/json'
        }
    });

    return {

        log: function (message) {

            if (!message || message.constructor !== Object) {

                log.error('Message object is not provided!');
                return;
            }

            if(message.type === "url_verification" || message.type !== "event_callback"){
                log.debug(`Ignoring ${message.type} message.`);
                return;
            }

            //log incoming message
            log.debug('Logging incoming message...\n' + util.inspect(message));
            // create copy of the message
            const payload = Object.assign({}, message);
            request({

                url: '/messages/slack/eventapi',
                method: 'POST',
                json: true,
                body: {
                    message: payload
                }

            }, (err, resp, payload) => {

                if (err) {

                    log.error('Failed to log incoming message.', err);

                } else {

                    err = log.checkResponse(resp, 'Successfully logged incoming message.', 'Failed to log incoming message.');

                    if (err) {

                        log.error('Failed to log incoming message.', err);
                    }
                }
            });
        }
    }
};