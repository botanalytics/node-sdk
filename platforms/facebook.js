const util = require('util');
const log = new require('../util').Logger(config);
const Base = require('./base');
const Promise = require('bluebird');

class Facebook extends Base {
	logIncomingMessage(data, callback) {
		log.debug('Logging incoming message: ' + util.inspect(data));

		if (!data) {
			const error = new Error('Message data is required.');
			callback && callback(error);
			return Promise.reject(error);
		}

		return new Promise((resolve, reject) => {
			this.request({
				url: '/messages/facebook-messenger',
				method: 'POST',
				json: true,
				body: {
					recipient: null,
					message: data
				}

			}, (err, resp, payload) => {
				if (err) {
					log.error('Failed to log incoming message.', err);
					callback && callback(new Error('Failed to log incoming message'));
					return reject(new Error('Failed to log incoming message'));
				}

				const message = log.checkResponse(resp, 'Successfully logged incoming message.', 'Failed to log incoming message.');

				callback && callback(null, message);
				resolve(message);
			});
		});
	}

	logOutgoingMessage(data, receipient, token, callback) {
		log.debug('Logging outgoing message: ' + util.inspect(data));

		if (!data || !receipient || !token) {
			const error = new Error('Message data, receipient and token is required.');
			callback && callback(error);
			return Promise.reject(error);
		} 

		return new Promise((resolve, reject) => {
			this.request({
				url: '/messages/facebook-messenger',
				method: 'POST',
				json: true,
				body: {
					recipient: recipient,
					message: data,
					fb_token: token
				}
			}, (err, resp, payload) => {
				if (err) {
					log.error('Failed to log outgoing message.', err);
					callback && callback(new Error('Failed to log outgoing message'));
					return reject(new Error('Failed to log outgoing message'));
				}

				const message = log.checkResponse(resp, 'Successfully logged outgoing message.', 'Failed to log outgoing message.');

				callback && callback(null, message);
				resolve(message);
			});
		});
	}

	logUserProfile(data, callback) {
		log.debug('Logging user profile: ' + util.inspect(data));

		if (!data) {
			const error = new Error('User data is required.');
			callback && callback(error);
			return Promise.reject(error);
		}

		return new Promise((resolve, reject) => {
			this.request({
				url: '/facebook-messenger/users',
				method: 'POST',
				json: true,
				body: data
			}, (err, resp, payload) => {
				if (err) {
					log.error('Failed to log user profile.', err);
					callback && callback(new Error('Failed to log user profile.'));
					return reject(new Error('Failed to log user profile.'));
				}

				const message = log.checkResponse(resp, 'Successfully logged user profile.', 'Failed to log user profile.');

				callback && callback(null, message);
				resolve(message);
			});
		});
	}
};

module.exports = Facebook;
