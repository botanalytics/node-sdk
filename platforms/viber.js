const util = require('util');
const objectPath = require('object-path');

const setIfAvailable = require('../util').setIfAvailable;

const EVENTS_MESSAGE_RECEIVED = 'message';
const EVENTS_MESSAGE_SENT = 'message_sent';
const EVENTS_CONVERSATION_STARTED = 'conversation_started';

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

	const _decideMessageType = (message) => {

		if (message.duration)
			return 'video';
		else if (message.thumbnail)
			return 'picture';
		else if (message.filename)
			return 'file';
		else if(message.url)
			return 'url';
		else if (message.text)
			return 'text';
		else if (message.contactName)
			return 'contact';
		else if (message.latitude)
			return 'location';
		else if (message.stickerId)
			return 'sticker';

		log.error('Failed to decide the type of message: ' + util.inspect(message) + ', falling back to text...');

		return 'text';
	};

	return {

		attach:  function(bot, callback) {

			// Check bot object
			if (!bot) {

				var err = new Error('You must provide a bot object!');

				if (callback)
					return callback(err);
				else
					return err;
			}

			// Listen to conversation start event
			bot.on(EVENTS_CONVERSATION_STARTED, (data, isSubscribed) => {

				var userProfile = {};

				Object.assign(userProfile, data.userProfile);

				log.debug('Logging user profile data: ' + util.inspect(userProfile));

				// Send user data
				request({

					url: '/viber/users/',
					method: 'POST',
					json: true,
					body: userProfile

				}, (err, resp, payload) => {

					if (err) {

						log.error('Failed to log user profile.', err);

						if (callback)
							callback(new Error('Failed to log user'));

						return;
					}

					err = log.checkResponse(resp, 'Successfully logged user profile.', 'Failed to log user profile.');

					if (callback)
						callback(err);
				});
			});

			// Listen to message received event
			bot.on(EVENTS_MESSAGE_RECEIVED, (messageObj, response) => {

				var message = {
					sender: {
						id: response.userProfile.id,
						name: response.userProfile.name
					},
					message: {
						type: _decideMessageType(messageObj),
						text: messageObj.text
					}
				};

				Object.assign(message, messageObj);

				log.debug('Logging received message: ' + util.inspect(message));

				message.message_token = messageObj.token;
				message.auth_token = bot.authToken;

				objectPath.del(message, 'token');

				// Send user data
				request({

					url: '/messages/viber/',
					method: 'POST',
					json: true,
					body: {
						message: message
					}

				}, (err, resp, payload) => {

					if (err) {

						log.error('Failed to log user profile.', err);

						if (callback)
							callback(new Error('Failed to log incoming message'));

						return;
					}

					err = log.checkResponse(resp, 'Successfully logged incoming message.', 'Failed to log incoming message.');

					if (callback)
						callback(err);
				});
			});

			// Listen to message sent event
			bot.on(EVENTS_MESSAGE_SENT, (messageObj, userProfile) => {

				console.log('Bot: ' + util.inspect(bot));

				var message = {
					receiver: {
						id: userProfile.id,
						name: userProfile.name
					},
					type: _decideMessageType(messageObj)
				};

				Object.assign(message, messageObj);

				log.debug('Logging sent message: ' + util.inspect(message));

				message.message_token = messageObj.token;
				message.auth_token = bot.authToken;

				objectPath.del(message, 'token');

				message.timestamp = new Date().getTime();

				// Send user data
				request({

					url: '/messages/viber/',
					method: 'POST',
					json: true,
					body: {
						message: message
					}

				}, (err, resp, payload) => {

					if (err) {

						log.error('Failed to log user profile.', err);

						if (callback)
							callback(new Error('Failed to log user'));

						return;
					}

					err = log.checkResponse(resp, 'Successfully logged outgoing message.', 'Failed to log outgoing message.');

					if (callback)
						callback(err);
				});
			});
		}
	};
}
