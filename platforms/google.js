'use strict';
const util = require('util');

const payloadSanity = function(req, res) {

    if(!req)
        return {ok:false, err : new Error(`No request data: ${util.inspect(req)}`)};
    if(!res)
        return {ok:false, err : new Error(`No response data: ${util.inspect(res)}`)};
    if(req.constructor !== Object)
        return {ok:false, err : new Error(`Request data is not an object : ${util.inspect(req)}`)};
    if(res.constructor !== Object)
        return {ok:false, err : new Error(`Response data is not an object : ${util.inspect(res)}`)};
    if(!req.user || !req.conversation || !req.inputs)
        return {ok:false, err : new Error(`Request data is missing one or more of the required fields user, conversation, inputs : ${util.inspect(res)}`)};
    if(!(res.expectedInputs || res.finalResponse))
        return {ok:false, err : new Error(`Response data is missing one or more of the required finalResponse or expectedInputs : ${util.inspect(req)}`)};
    return {ok:true, err:null};
};

module.exports = function(token, userConfig) {

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
        log : (req, res) => {
            //check sanity
            const sanity = payloadSanity(req, res);
            //process
            if(sanity.ok)

                request({

                    url: '/messages/google-assistant/',
                    method: 'POST',
                    json: true,
                    body: {
                        request : req,
                        response: res
                    }

                }, (err, resp, payload) => {

                    if (err) {

                        log.error('Failed to log message.', err);
                        return;
                    }

                    err = log.checkResponse(resp, 'Successfully logged messages.', 'Failed to log messages.');
                    if(err)
                        log.error("Failed to log message", err);
                });
            else
                log.error("Failed to process messages.", sanity.err);
        },
        attach: (assistant, callback) => {

            assistant.originalDoResponse = assistant.doResponse_;
            assistant.doResponse_ = function (responseData, responseCode) {

                const sanity = payloadSanity(assistant.body_, responseData);

                if(sanity.ok)
                    request({

                        url: '/messages/google-assistant/',
                        method: 'POST',
                        json: true,
                        body: {
                            request : assistant.body_,
                            response: responseData
                        }

                    }, (err, resp, payload) => {

                        if (err) {

                            log.debug(`Failed to log message. Reason: ${err.message}`);
                            if(callback)
                            	callback(err);
                            return;
                        }

                        err = log.checkResponse(resp, 'Successfully logged messages.', 'Failed to log messages.');

                        if(err){
                            log.debug(`Failed to log message. Reason: ${err.message}`);
							if (callback)
								callback(err)
                        }
                    });
                else{
                    log.error(`Failed to log messages. Reason: ${sanity.err.message}`);
                    if(callback)
                    	callback(sanity.err)
                }

                assistant.originalDoResponse(responseData, responseCode);

            };
        }
    };
};
