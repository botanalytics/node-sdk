'use strict';
const util = require('util');

module.exports = function(token, userConfig) {

    // Check token
    if (!token)
        throw new Error('You must provide a Botanalytics token!');

    // Create default config
    const config = {
        baseUrl: 'https://api.botanalytics.co/v1/',
        debug: false
    };

    // Merge user configuration into the default config
    Object.assign(config, userConfig);

    const log = new require('../util').Logger(config);

    log.debug('Logging enabled.');

    log.debug('Configuration: ' + util.inspect(config));

    // Configure request defaults
    const request = require('request').defaults({
        baseUrl: config.baseUrl,
        headers: {
            'Authorization': 'Token ' + encodeURIComponent(token),
            'Content-Type': 'application/json',
            'X-Botanalytics-Client-Id': 'node',
            'X-Botanalytics-Client-Version': util.getVersion()
        }
    });

    return {

        handler: function(originalHandler) {
            return function (event, context, callback) {
                const wrappedCallback = function (err, response) {
                    request({
                        url: '/messages/amazon-alexa/',
                        method: 'POST',
                        json: true,
                        body: {
                            request:event,
                            response:response
                        }
                    }, (err, resp) => {

                        if (err) {

                            log.error('Failed to log incoming message.', err);

                        } else {

                            err = log.checkResponse(resp, 'Successfully logged incoming message.', 'Failed to log incoming message.');

                            if (err)
                                log.error('', err);
                        }
                    });
                    callback(err, response);
                };
                const promise = originalHandler(event, context, wrappedCallback);
                if(promise && promise instanceof Promise){
                    return promise.then(function (response) {
                        return new Promise(function (resolve, reject) {
                            request({
                                url: '/messages/amazon-alexa/',
                                method: 'POST',
                                json: true,
                                body: {
                                    request:event,
                                    response:response
                                }
                            }, (err, resp, payload) => {

                                if (err) {

                                    log.error('Failed to log incoming message.', err);

                                } else {

                                    err = log.checkResponse(resp, 'Successfully logged incoming message.', 'Failed to log incoming message.');

                                    if (err)
                                        log.error('', err);
                                }
                                resolve(response);
                            });
                        });
                    });
                }
            };
        },
        log : function (incoming, outgoing){

            // payload sanity checkings
            if(!incoming) {
                log.error('Invalid request payload.', new Error(`Request payload is expected but not found!.`));
                return;
            }
            if(!outgoing) {
                log.error('Invalid response payload', new Error(`Response payload is expected but not found.`));
                return;
            }
            if(!incoming.request){
                log.error('Invalid request payload', new Error("No request field is found in incoming message."));
                return;
            }
            if(!incoming.context){
                log.error('Invalid request payload', new Error("No context field is found in incoming message."));
                return;
            }
            if(!outgoing.response) {
                log.error('Invalid response payload', new Error("No response field is found in outgoing message."));
                return;
            }

            log.debug('Logging incoming message: ' + util.inspect(incoming));
            log.debug('Logging outgoing message: ' + util.inspect(outgoing));


            request({
                url: '/messages/amazon-alexa/',
                method: 'POST',
                json: true,
                body: {
                    request:incoming,
                    response:outgoing
                }
            }, (err, resp) => {

                if (err)
                    log.error('Failed to log incoming message.', err);
                else {

                    err = log.checkResponse(resp, 'Successfully logged incoming message.', 'Failed to log incoming message.');

                    if(err)
                        log.error('Messages can not be logged.', err);
                }
            });
        }
    };
};
