'use strict';
const util = require('util');

const payloadSanity = function(req, res) {

    if(!req)
        return {ok:false, err : new Error(`No request data: ${JSON.stringify(req)}`)};
    if(!res)
        return {ok:false, err : new Error(`No response data: ${JSON.stringify(res)}`)};
    if(req.constructor !== Object)
        return {ok:false, err : new Error(`Request data is not an object : ${JSON.stringify(req)}`)};
    if(res.constructor !== Object)
        return {ok:false, err : new Error(`Response data is not an object : ${JSON.stringify(res)}`)};
    if(!req.user || !req.conversation || !req.inputs)
        return {ok:false, err : new Error(`Request data is missing one or more of the required fields user, conversation, inputs : ${JSON.stringify(req)}`)};
    if(!(res.expectedInputs || res.finalResponse))
        return {ok:false, err : new Error(`Response data is missing one or more of the required finalResponse or expectedInputs : ${JSON.stringify(res)}`)};
    return {ok:true, err:null};
};

const payloadSanityDialogflow = function(req, res){
    if(!req)
        return {ok:false, err : new Error(`No request data: ${JSON.stringify(req)}`)};
    if(!res)
        return {ok:false, err : new Error(`No response data: ${JSON.stringify(res)}`)};
    if(req.constructor !== Object)
        return {ok:false, err : new Error(`Request data is not an object : ${JSON.stringify(req)}`)};
    if(res.constructor !== Object)
        return {ok:false, err : new Error(`Response data is not an object : ${JSON.stringify(res)}`)};
    if(!res.payload)
        return {ok:false, err: new Error(`Field <payload> is required in response object: ${JSON.stringify(res)} but not found.`)};
    if(!res.payload.google)
        return {ok:false, err: new Error(`Field <payload.google> is required in response object: ${JSON.stringify(res)} but not found.`)};
    if(!req.originalDetectIntentRequest || !req.queryResult)
        return {ok:false, err: new Error(`Fields, <originalDetectIntentRequest> and <queryResult> are required in request object: ${JSON.stringify(req)} but not found.`)};
    return {ok:true, err:null};
};
const isDialogflow = function(req){
  if(req.originalDetectIntentRequest && req.queryResult)
      return true;
  return false;

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
            if(!isDialogflow(req)){
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
            }else{
                //check sanity
                const sanity = payloadSanityDialogflow(req, res);
                //process
                if(sanity.ok)
                    request({

                        url: '/messages/google-assistant/dialogflow/',
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
            }

        },
        attach: (assistant, callback) => {

            assistant.originalHandler = assistant.handler;
            assistant.handler = function (r, h) {
                return assistant
                    .originalHandler(r, h)
                    .then((response) => {

                        if(!isDialogflow(r)){
                            const sanity = payloadSanity(r, response.body);

                            if(sanity.ok)
                                request({
                                    url: '/messages/google-assistant/',
                                    method: 'POST',
                                    json: true,
                                    body: {
                                        request : r,
                                        response: response.body
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
                            return response;
                        }else {
                            const sanity = payloadSanityDialogflow(r, response.body);

                            if(sanity.ok)
                                request({
                                    url: '/messages/google-assistant/dialogflow/',
                                    method: 'POST',
                                    json: true,
                                    body: {
                                        request : r,
                                        response: response.body
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
                            return response;
                        }
                    });
            };
        }
    };
};
