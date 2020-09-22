const util = require('util');

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

	log.debug('Configuration: ' + util.inspect(config));

	// Configure request defaults
	const request = require('request').defaults({
		baseUrl: config.baseUrl,
		headers: {
            'Authorization': 'Token ' + encodeURIComponent(token),
            'Content-Type': 'application/json',
            'X-Botanalytics-Client-Id': 'node',
            'X-Botanalytics-Client-Version': require('../util').getVersion()
		}
	});

	return {

		logIncomingMessage: (data, callback) => {

			log.debug('Logging incoming message: ' + util.inspect(data));

			if (!data) {

				log.error('Message data is required.');

				const err = new Error('Message data is required.');

				if (callback)
					return callback(err);
				else
					return err;
			}

			request({

				url: '/messages/facebook-messenger/',
				method: 'POST',
				json: true,
				body: {
					recipient: null,
					timestamp: new Date().getTime(),
					message: data
				}

			}, (err, resp, payload) => {

				if (err) {

					log.error('Failed to log incoming message.', err);

					err = new Error('Failed to log incoming message');

					if (callback)
						return callback(err);
					else
						return err;
				}

				err = log.checkResponse(resp, 'Successfully logged incoming message.', 'Failed to log incoming message.');

				if (callback)
					return callback(err);
				else
					return err;
			});
		},

		logOutgoingMessage: (data, recipient, token, callback) => {

			log.debug('Logging outgoing message: ' + util.inspect(data));

			if (!data) {

				log.error('Message data is required.');

				const err = new Error('Message data is required.');

				if (callback)
					return callback(err);
				else
					return err;
			}

			if (!recipient) {

				log.error('Message recipient is required.');

				const err = new Error('Message recipient is required.');

				if (callback)
					return callback(err);
				else
					return err;
			}

			request({

				url: '/messages/facebook-messenger/',
				method: 'POST',
				json: true,
				body: {
					recipient: recipient,
					message: data,
					timestamp: new Date().getTime(),
					fb_token: token
				}

			}, (err, resp, payload) => {

				if (err) {

					log.error('Failed to log outgoing message.', err);

					err = new Error('Failed to log outgoing message.');

					if (callback)
						callback(err);
					else
						return err;
				}

				err = log.checkResponse(resp, 'Successfully logged incoming message.', 'Failed to log incoming message.');

				if (callback)
					callback(err);
				else
					return err;
			});
		},

		logUserProfile: (data, callback) => {

			log.debug('Logging user profile: ' + util.inspect(data));

			if (!data) {

				log.error('User profile data is required.');

				const err = new Error('User profile data is required.');

				if (callback)
					return callback(err);
				else
					return err;
			}

			request({

				url: '/facebook-messenger/users/',
				method: 'POST',
				json: true,
				body: data

			}, (err, resp, payload) => {

				if (err) {

					log.error('Failed to log user profile.', err);

					err = new Error('Failed to log user profile.');

					if (callback)
						callback(err);
					else
						return err;
				}

				err = log.checkResponse(resp, 'Successfully logged incoming message.', 'Failed to log incoming message.');

				if (callback)
					callback(err);
				else
					return err;
			});
		}
	}
};
