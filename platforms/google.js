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
					err = log.checkResponse(resp, 'Successfully logged incoming message.', 'Failed to log incoming message.');
					log.error("Failed to log message", err);
				});
			else
				log.error("Failed to process messages.", sanity.err);
		},
		attach: (Assistant, config, callback) => {

			if(!config.request || !config.response){
				const err = new Error("Empty request or response object.");
				log.error("Can not be attached!", err );
				if(callback)
					callback(err);
				return new Assistant(config);
			}

			if(config.response.send.constructor !== Function){
                const err = new Error("Response is not an express js response object");
                log.error("Can not be attached!", err );
                if(callback)
                    callback(err);
                return new Assistant(config);
			}
			// override send
			const temp = config.response.end;
			config.response.end = function (responseBuff) {
				const responseData = JSON.parse(responseBuff.toString());
				const sanity = payloadSanity(config.request.body, responseData);
				if(sanity.ok)
                    request({

                        url: '/messages/google-assistant/',
                        method: 'POST',
                        json: true,
                        body: {
                            request : config.request.body,
                            response: responseData
                        }

                    }, (err, resp, payload) => {

                        if (err) {

                            log.error('Failed to log message.', err);
                            return;
                        }

                        err = log.checkResponse(resp, 'Successfully logged incoming message.', 'Failed to log incoming message.');
						log.error('Failed to log messages.', err);
                    });
				else {
					log.error('Failed to log messages', sanity.err);
				}
				temp.apply(this, arguments);
            };

			return new Assistant(config);
		}
	};
};
