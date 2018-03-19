const util = require('util');
const objectPath = require('object-path');

function getResponseContent(response) {

    if(objectPath.get(response, "dialogAction.message", null))
        return objectPath.get(response, "dialogAction.message.content","");

    if(objectPath.get(response, "dialogAction.responseCard", null))
        return objectPath
            .get("dialogAction.responseCard.genericAttachments",[])
            .map(function (card) {
                return card.title+"/"+card.subTitle;
            }).join(",");
    return "";
}

function getResponseType(response) {

    if(objectPath.get(response,"dialogAction.responseCard.contentType") === "application/vnd.amazonaws.card.generic")
        return "card";

    return objectPath.get(response, "dialogAction.message.contentType","PlainText") === "PlainText" ? "text" : "SSML";
}

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

    const logger = new require('../util').Logger(config);

    logger.debug('Logging enabled.');

    logger.debug('Configuration: ' + util.inspect(config));

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

        log: function(event, context, response) {

            // Check event object
            if (!event || event.constructor !== Object) {

                logger.error("Event Error:", new Error('You must provide an event object!'));
                return;
            }
            //Check response object
            if(!response || response.constructor !== Object){

                logger.error("Response Error:", new Error('You must provide a response object!'));
                return;
            }

            //Check unique requestId to bind payloads

            if(!context || !context.awsRequestId){
                logger.error("Context Error:", new Error('You must provide context'));
                return;
            }

            logger.debug('Preparing payload...');

            const payload = {
                "user_id" : objectPath.get(event, "userId", null),
                "user_content" : objectPath.get(event, "inputTranscript", ""),
                "bot_content" : getResponseContent(response),
                "user_request_type" : objectPath.get(event, "outputDialogMode") === "Text" ? "text" : "voice",
                "bot_response_type" : getResponseType(response),
                "request" : {
                    "id" : context.awsRequestId,
                    "attributes" : objectPath.get(event, "requestAttributes", {}),
                    "state" : objectPath.get(response, "dialogAction.fulfillmentState", ""),
                    "bot_name" : objectPath.get(event, "bot.name",""),
                    "intent_resolved_name" : objectPath.get(event, "currentIntent.name", ""),
                    "intent_applied_name" : objectPath.get(response, "dialogAction.intentName", ""),
                    "intent_confirmation_status" : objectPath.get(event, "currentIntent.confirmationStatus","")
                }
            };
            
            logger.debug("Logging...");

            request({

                url: '/messages/amazon-lex/',
                method: 'POST',
                json: true,
                body: {
                    message: payload
                }

            }, (err,resp) => {

                if (err) {

                    logger.error('Failed to log incoming message.', err);

                } else {

                    err = logger.checkResponse(resp, 'Successfully logged incoming message.', 'Failed to log incoming message.');

                    if(err){
                        logger.error("Failed to log.", err);
                    }
                }
            });
        },
        handler : function (handler) {

            if(!handler || handler.constructor !== Function){
                throw new Error("Handler function is not provided!");
            }

            let event, context, callback;

            const rCatch = function (a, response) {

                logger.debug('Preparing payload...');

                const payload = {
                    "user_id" : objectPath.get(event, "userId", null),
                    "user_content" : objectPath.get(event, "inputTranscript", ""),
                    "bot_content" : getResponseContent(response),
                    "user_request_type" : objectPath.get(event, "outputDialogMode") === "Text" ? "text" : "voice",
                    "bot_response_type" : getResponseType(response),
                    "request" : {
                        "id" : context.awsRequestId,
                        "attributes" : objectPath.get(event, "requestAttributes", {}),
                        "state" : objectPath.get(response, "dialogAction.fulfillmentState", ""),
                        "bot_name" : objectPath.get(event, "bot.name",""),
                        "intent_resolved_name" : objectPath.get(event, "currentIntent.name", ""),
                        "intent_applied_name" : objectPath.get(response, "dialogAction.intentName", ""),
                        "intent_confirmation_status" : objectPath.get(event, "currentIntent.confirmationStatus","")
                    }
                };

                logger.debug("Logging...");

                request({

                    url: '/messages/amazon-lex/',
                    method: 'POST',
                    json: true,
                    body: {
                        message: payload
                    }

                }, (err,resp) => {

                    if (err) {

                        logger.error('Failed to log incoming message.', err);

                    } else {

                        err = logger.checkResponse(resp, 'Successfully logged incoming message.', 'Failed to log incoming message.');

                        if(err){
                            logger.error("Failed to log.", err);
                        }
                    }
                });
                callback(a, response);
            };
            return function (_event, _context, _callback) {
                event = _event;
                context = _context;
                callback = _callback;
                handler(_event, _context, rCatch);
            }
        }
    };
};
