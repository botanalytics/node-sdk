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

        receive : function (bot, message, next) {
            //sanity check
            if(!bot){

                log.error('Bot object is not provided!');
                next();
                return;
            }

            if(!message || message.constructor !== Object){

                log.error('Message object is not provided!');
                next();
                return;
            }

            if(message.type !== "direct_message" && bot.type === "slack"){

                log.debug('Ignoring message types other than <direct_message>, message type <'+message.type+'>');
                next();
                return;
            }

            //log incoming message
            log.debug('Logging incoming message...\n'+util.inspect(message));
            // create copy of the message
            const payload = Object.assign({}, message);
            //release
            next();
            //additional info
            payload.botanalytics = {
                agent       : 'botkit',
                source      : bot.type,
                timestamp   : new Date().getTime(),
                is_bot      : false
            };

            request({

                url: '/integrations/botkit/watson/',
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
        },
        send : function (bot, message, next) {

            //sanity check
            if(!bot){

                log.error('Bot object is not provided!');
                next();
                return;
            }

            if(!message || message.constructor !== Object){

                log.error('Message object is not provided!');
                next();
                return;
            }

            //log outgoing message
            log.debug('Logging outgoing message...\n'+util.inspect(message));
            // create copy of the message
            const payload = Object.assign({}, message);
            //release
            next();
            //additional info
            payload.botanalytics = {
                agent       : 'botkit',
                source      : bot.type,
                timestamp   : new Date().getTime(),
                is_bot      : true
            };

            request({

                url: '/integrations/botkit/watson/',
                method: 'POST',
                json: true,
                body: {
                    message: payload
                }

            }, (err, resp, payload) => {

                if (err) {

                    log.error('Failed to log outgoing message.', err);

                } else {

                    err = log.checkResponse(resp, 'Successfully logged incoming message.', 'Failed to log incoming message.');

                    if (err) {

                        log.error('Failed to log incoming message.', err);
                    }
                }
            });
        }
    };
};