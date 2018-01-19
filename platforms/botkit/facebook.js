'use strict';

/**
 * Botanalytics facebook middleware.
 */

const util = require('util');
const objectPath = require("object-path");

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

        receive: function (bot, message, next) {

            log.debug('Logging incoming message: ' + util.inspect(message));

            // Check bot object
            if (!bot) {

                log.error('You must provide a bot object!');
                next();
                return;
            }

            // Check message data object
            if (!message) {

                log.error('You must provide message data!');
                next();
                return;
            }

            const senderId = message.user;
            const timestamp = message.timestamp;

            const messageCopy = Object.assign({}, message);

            //release
            next();

            objectPath.del(messageCopy, 'user');
            objectPath.del(messageCopy, 'timestamp');

            const payload = {
                recipient: null,
                timestamp: timestamp,
                message: {
                    object: 'page',
                    entry: [{
                        time: timestamp,
                        messaging: [{
                            sender: {
                                id: senderId
                            },
                            timestamp: timestamp,
                            message: messageCopy
                        }]
                    }]
                }
            }; 

            request({

                url: '/integrations/botkit/facebook-messenger/',
                method: 'POST',
                json: true,
                body: payload

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
        },
        send: function (bot, message, next) {

            log.debug('Logging outgoing message: ' + util.inspect(message));
            // Check bot object
            if (!bot) {

                log.error('You must provide a bot object!');
                next();
                return;
            }

            // Check message data object
            if (!message) {

                log.error('You must provide message data!');
                next();
                return;
            }

            const recipient = message.channel;
            const timestamp = new Date().getTime();

            const messageCopy = Object.assign({}, message);
            //release
            next();
            objectPath.del(messageCopy, 'channel');

            const payload = {
                recipient: recipient,
                timestamp: timestamp,
                message: messageCopy
            };

            request({

                url: '/integrations/botkit/facebook-messenger/',
                method: 'POST',
                json: true,
                body: payload

            }, (err, resp, payload) => {

                if (err) {
                    log.error('Failed to log outgoing message.', err);
                } else {
                    err = log.checkResponse(resp, 'Successfully logged outgoing message.', 'Failed to log outgoing message.');
                    if (err) {
                        log.error('Failed to log outgoing message.', err);
                    }
                }
            });
        }
    };
};