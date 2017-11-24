const util = require('util');
const objectPath = require('object-path');

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
			'Content-Type': 'application/json'
		}
	});

	const isHealthCheck = (data) => {

		var inputArray = objectPath.get(data, 'originalRequest.data.inputs');

		if (!inputArray || !inputArray.length)
			return false;

		for (var i = 0; i < inputArray.length; i++) {

			var inputObj = inputArray[i];

			var argumentArray = objectPath.get(inputObj, 'arguments');

			if (!argumentArray || !argumentArray.length)
				return false;

			for (var j = 0; j < argumentArray.length; j++) {

				var argumentObj = argumentArray[j];

				if (objectPath.get(argumentObj, 'name') === 'is_health_check' && objectPath.get(argumentObj, 'text_value') === '1')
					return true;
			}
		}

		return false;
	}

	const logIncomingMessage_ = (data, callback) => {

		log.debug('Logging incoming message: ' + util.inspect(data));

		if (isHealthCheck(data)) {

			log.debug('Ignoring health check...');

			return;
		}

		// Add timestamp to the data object
		objectPath.set(data, 'timestamp', new Date().getTime());

		request({

			url: '/messages/user/google-assistant/',
			method: 'POST',
			json: true,
			body: {
				message: data
			}

		}, (err, resp, payload) => {

			if (err) {

				log.error('Failed to log user message.', err);

				if (callback)
					callback(new Error('Failed to log user message'));

				return;
			}

			err = log.checkResponse(resp, 'Successfully logged incoming message.', 'Failed to log incoming message.');

			if (callback)
				callback(err);
		});
	};

	const logOutgoingMessage_ = (requestData, responseData, callback) => {

		var userId, conversationId;

		// Check if data has originalRequest property and fill the extract information
		if (objectPath.has(requestData, 'originalRequest')) {

			userId = objectPath.get(requestData, 'originalRequest.data.user.user_id');
			conversationId = objectPath.get(requestData, 'originalRequest.data.conversation.conversationId');

		} else {

			userId = objectPath.get(requestData, 'user.user_id');
			conversationId = objectPath.get(requestData, 'conversation.conversation_id');
		}

		log.debug('Logging incoming message: ' + util.inspect(responseData));

		// Add timestamp to the data object
		objectPath.set(responseData, 'timestamp', new Date().getTime());

		request({

			url: '/messages/bot/google-assistant/',
			method: 'POST',
			json: true,
			body: {
				message: responseData,
				user: {
					user_id: userId
				},
				conversation: {
					conversation_id: conversationId
				}
			}

		}, (err, resp, payload) => {

			if (err) {

				log.error('Failed to log user message.', err);

				if (callback)
					callback(new Error('Failed to log user message'));

				return;
			}

			err = log.checkResponse(resp, 'Successfully logged incoming message.', 'Failed to log incoming message.');

			if (callback)
				callback(err);
		});
	};

	return {

		logIncomingMessage: logIncomingMessage_,

		logOutgoingMessage: logIncomingMessage_,

		attach: (assistant, callback) => {

			// Check assistant object
			if (!assistant) {

				var err = new Error('You must provide an assistant object!');

				if (callback)
					return callback(err);
				else
					return err;
			}

			this.assistantRef = assistant;

			this.assistantRef.originalDoResponse = assistant.doResponse_;
			this.assistantRef.doResponse_ = (responseData, responseCode) => {

				logOutgoingMessage_(this.requestData, responseData, callback);

				this.assistantRef.originalDoResponse(responseData, responseCode);
			}

			this.requestData = assistant.body_;

			logIncomingMessage_(assistant.body_, callback);
		}
	};
}
