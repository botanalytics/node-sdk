const util = require('util');
const objectPath = require('object-path');

const buildIncomingPayload = (that) => {

	var payload = {
		session: {
			id: objectPath.get(that, 'event.session.sessionId'),
			attributes: objectPath.get(that, 'event.session.attributes')
		},
		state: that.state,
		user_id: objectPath.get(that, 'event.session.user.userId'),
		application_id: objectPath.get(that, 'event.session.application.applicationId'),
		device: {
			supportedInterfaces: Object.keys(objectPath.get(that, 'event.context.System.device.supportedInterfaces', {}))
		},
		request: {
			id: objectPath.get(that, 'event.request.requestId'),
			locale: objectPath.get(that, 'event.request.locale'),
			type: objectPath.get(that, 'event.request.type')
		}
	}

	if (that.event.request.intent) {

		objectPath.set(payload, 'request.intent.name', that.event.request.intent.name);
		objectPath.set(payload, 'request.intent.slots', that.event.request.intent.slots);
	}

	return payload;
};

const buildOutgoingPayloadForTell = (that, command, speechOutput, cardTitle, cardContent, imageObj) => {

	var payload =  {
		session: {
			id: objectPath.get(that, 'event.session.sessionId'),
			attributes: objectPath.get(that, 'event.session.attributes')
		},
		state: that.state,
		user_id: objectPath.get(that, 'event.session.user.userId'),
		application_id: objectPath.get(that, 'event.session.application.applicationId'),
		device: {
			supportedInterfaces: Object.keys(objectPath.get(that, 'event.context.System.device.supportedInterfaces', {}))
		},
		request: {
			id: objectPath.get(that, 'event.request.requestId'),
			locale: objectPath.get(that, 'event.request.locale'),
			type: objectPath.get(that, 'event.request.type')
		},
		tell: {
			command: command,
			text: speechOutput
		}
	}

	if (that.event.request.intent) {

		objectPath.set(payload, 'request.intent.name', that.event.request.intent.name);
		objectPath.set(payload, 'request.intent.slots', that.event.request.intent.slots);
	}

	// Check if a permission array is passed
	if (Array.isArray(cardTitle)) {

		objectPath.set(payload, 'tell.permissionArray', cardTitle);

		return payload;
	}

	if (cardTitle)
		objectPath.set(payload, 'tell.card.title', cardTitle);
	if (cardContent)
		objectPath.set(payload, 'tell.card.content', cardContent);
	if (imageObj)
		objectPath.set(payload, 'tell.card.image', imageObj);

	return payload;
};

const buildOutgoingPayloadForAsk = (that, command, speechOutput, repromptSpeech, cardTitle, cardContent, imageObj) => {

	var payload =  {
		session: {
			id: that.event.session.sessionId,
			attributes: that.event.session.attributes
		},
		state: that.state,
		user_id: that.event.context.System.user.userId,
		application_id: that.event.context.System.application.applicationId,
		device: {
			supportedInterfaces: Object.keys(that.event.context.System.device.supportedInterfaces)
		},
		request: {
			id: that.event.request.requestId,
			locale: that.event.request.locale,
			type: that.event.request.type,
			intent: {
				name: that.event.request.intent.name,
				slots: that.event.request.intent.slots
			}
		},
		ask: {
			command: command,
			text: speechOutput,
			reprompt: repromptSpeech
		}
	}

	if (cardTitle)
		objectPath.set(payload, 'ask.card.title', cardTitle);
	if (cardContent)
		objectPath.set(payload, 'ask.card.content', cardContent);
	if (imageObj)
		objectPath.set(payload, 'ask.card.image', imageObj);

	return payload;
};

const extractValues = (obj) => {

	var keys = Object.keys(obj);

	var values = [];

	for (var i = 0; i < keys.length; i++) {
		values.push(obj[keys[i]]);
	}

	return values;
};

module.exports = function(token, userConfig) {

	// Check token
	if (!token) {

		throw new Error('You must provide a Botanalytics token!');
	}

	// Create default config
	var config = {
		baseUrl: 'https://botanalytics.co/api/v1/',
		debug: false
	}

	// Merge user configuration into the default config
	Object.assign(config, userConfig);

	const log = new require('../util').Logger(config);

	log.debug('Logging enabled.');

	log.debug('Configuration: ' + util.inspect(config))

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

		//logIncomingMessage: logIncomingMessage_,

		//logOutgoingMessage: logIncomingMessage_,

		attach: function(handlerObject, callback) {

			// Check handler object
			if (!handlerObject || handlerObject.constructor !== Object) {

				var err = new Error('You must provide a handler object!');

				if (callback)
					return callback(err);
				else
					return err;
			}

			log.debug('Attaching to handler object...');
			
			var eventNames = Object.keys(handlerObject);
			
			var proxiedObject = {};
			
			for (var i = 0; i < eventNames.length; i++) {
				
				var eventName = eventNames[i];
				
				if(typeof(handlerObject[eventName]) !== 'function') {


                	var err = new Error('Event handler for \'' + eventName + '\' was not a function.');

                	if (callback)
                		return callback(err);
                	
                	return handlerObject; // We need to return the original handler object to avoid breaking the bot
				}
                
                proxiedObject[eventName] = function() {

                	log.debug('Invoking event \'' + this.name + '\'...');

                	var originalArgs = extractValues(arguments);

                	var originalFunc = objectPath.get(handlerObject, this.name);

                	var incomingPayload = buildIncomingPayload(this);

					var thisRef = this;
					thisRef.originalEmit = thisRef.emit;

					thisRef.emit = function() {

						var command = objectPath.get(arguments, '0');

						var outgoingPayload;

						if (command.startsWith(':tell')) {

							var speechOutput = objectPath.get(arguments, '1');
							var cardTitle = objectPath.get(arguments, '2');
							var cardContent = objectPath.get(arguments, '3');
							var imageObj = objectPath.get(arguments, '4');

							outgoingPayload = buildOutgoingPayloadForTell(this, command, speechOutput, cardTitle, cardContent, imageObj);

						} else if (command.startsWith(':ask')) {

							var speechOutput = objectPath.get(arguments, '1');
							var repromptSpeech = objectPath.get(arguments, '2');
							var cardTitle = objectPath.get(arguments, '3');
							var cardContent = objectPath.get(arguments, '4');
							var imageObj = objectPath.get(arguments, '5');

							outgoingPayload = buildOutgoingPayloadForTell(this, command, speechOutput, repromptSpeech, cardTitle, cardContent, imageObj);
						} else {

							var originalArgs = extractValues(arguments);

							this.originalEmit.apply(this, originalArgs);

							return;							
						}

						var originalArgs = extractValues(arguments);

						request({

							url: '/messages/user/amazon-alexa/',
							method: 'POST',
							json: true,
							body: {
								message: incomingPayload
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

							request({

								url: '/messages/bot/amazon-alexa/',
								method: 'POST',
								json: true,
								body: {
									message: outgoingPayload
								}

							}, (err, resp, payload) => {

								if (err) {

									log.error('Failed to log outgoing message.', err);

									if (callback)
										callback(new Error('Failed to log outgoing message'));

								} else {

									err = log.checkResponse(resp, 'Successfully logged outgoing message.', 'Failed to log outgoing message.');

									if (callback)
										callback(err);
								}

								this.originalEmit.apply(this, originalArgs);
							});
						});
					};

					originalFunc.apply(this, originalArgs);
                };
			}
			
			return proxiedObject;
		}
	};
}
