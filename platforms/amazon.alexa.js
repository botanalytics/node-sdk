'use strict';
const util = require('util');
const extractValues = function(obj){

    const keys = Object.keys(obj);

    const values = [];

    for (let i = 0; i < keys.length; i++) {
        values.push(obj[keys[i]]);
    }

    return values;
};
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

    require('request').debug = true;

    // Configure request defaults
    const request = require('request').defaults({
        baseUrl: config.baseUrl,
        headers: {
            'Authorization': 'Token ' + encodeURIComponent(token),
            'Content-Type': 'application/json'
        }
    });

    return {

        attach: function(handlerObject, callback) {

            // Check handler object
            if (!handlerObject || handlerObject.constructor !== Object) {
                if (callback)
                    return callback(new Error('You must provide a handler object!'));
                return new Error('You must provide a handler object!');
            }

            log.debug('Attaching to handler object...');

            let isAttached = false;

            const eventNames = Object.keys(handlerObject);

            const proxiedObject = {};

            for (let i = 0; i < eventNames.length; i++) {

                if(typeof(handlerObject[eventNames[i]]) !== 'function') {

                    if (callback)
                        callback(new Error(`Event handler for '${eventNames[i]}' was not a function.`));

                    return handlerObject; // We need to return the original handler object to avoid breaking the bot
                }

                proxiedObject[eventNames[i]] = function() {

                    const self = this;
                    log.debug(`Invoking event ${self.name}...`);
                    const originalArgs = extractValues(arguments);
                    const originalFunc = handlerObject[self.name];

                    if(!isAttached){

                        const listeners = this.handler.listeners(':responseReady');
                        this.handler.removeAllListeners(':responseReady');
                        listeners.forEach(function (listener) {
                            self.handler.addListener(':responseReady', function () {

                                if(typeof self.handler._callback === 'function'){
                                    request({
                                        url: '/messages/amazon-alexa/',
                                        method: 'POST',
                                        json: true,
                                        body: {
                                            request:self.event,
                                            response:self.handler.response
                                        }
                                    }, (err, resp, payload) => {

                                        if (err) {

                                            log.error('Failed to log incoming message.', err);

                                            if (callback)
                                                callback(new Error('Failed to log incoming message'));

                                        } else {

                                            err = log.checkResponse(resp, 'Successfully logged incoming message.', 'Failed to log incoming message.');

                                            if (callback)
                                                callback(err);
                                        }
                                    });
                                    listener.apply(self, extractValues(arguments));
                                }else {
                                    request({
                                        url: '/messages/amazon-alexa/',
                                        method: 'POST',
                                        json: true,
                                        body: {
                                            request:self.event,
                                            response:self.handler.response
                                        }
                                    }, (err, resp, payload) => {

                                        if (err) {

                                            log.error('Failed to log incoming message.', err);

                                            if (callback)
                                                callback(new Error('Failed to log incoming message'));

                                        } else {

                                            err = log.checkResponse(resp, 'Successfully logged incoming message.', 'Failed to log incoming message.');

                                            if (callback)
                                                callback(err);
                                        }
                                        listener.apply(self, extractValues(arguments));
                                    });
                                }
                            });
                        });
                        isAttached = true;
                    }
                    originalFunc.apply(self, originalArgs);
                };
            }
            return proxiedObject;
        },
        log : function (incoming, outgoing, callback){

            let isCallbackProvided = true;

            if(callback && callback.constructor !== Function){
                isCallbackProvided = false;
                log.debug("Callback function is not provided for log.")
            }

            if(!incoming || incoming.constructor !== Object){
                if(isCallbackProvided) {
                    callback(new Error(`Request payload is expected as an object but found: ${incoming.constructor}`));
                    return;
                }
                else
                    return new Error(`Request payload is expected as an object but found: ${incoming.constructor}`);
            }

            if(!outgoing || outgoing.constructor !== Object){
                if(isCallbackProvided) {
                    callback(new Error(`Response payload is expected as an object but found: ${outgoing.constructor}`));
                    return;
                }
                else
                    return new Error(`Request payload is expected as an object but found: ${outgoing.constructor}`);
            }
            //request object sanity
            if(!incoming.request){
                if(isCallbackProvided){
                    callback(new Error("No request field is found in incoming message."));
                    return;
                }
                else
                    return new Error("No request field is found in incoming message.");
            }
            if(!incoming.context){

                if(isCallbackProvided){
                    callback(new Error("No context field is found in incoming message."));
                    return;
                }
                else
                    return new Error("No context field is found in incoming message.");
            }
            //response object sanity
            if(!outgoing.response) {
                if (isCallbackProvided){
                    callback(new Error("No response field is found in outgoing message."));
                    return;
                 }
                else
                    return new Error("No response field is found in outgoing message.");
            }
            request({
                url: '/messages/amazon-alexa/',
                method: 'POST',
                json: true,
                body: {
                    request:incoming,
                    response:outgoing
                }
            }, (err, resp, payload) => {

                if (err) {

                    log.error('Failed to log incoming message.', err);

                    if (isCallbackProvided)
                        callback(new Error('Failed to log incoming message'));

                } else {

                    err = log.checkResponse(resp, 'Successfully logged incoming message.', 'Failed to log incoming message.');

                    if (isCallbackProvided)
                        callback(err);
                }
            });
        }
    };
};
