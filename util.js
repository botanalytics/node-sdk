const util = require('util');

exports.Logger = function(config) {

	this.config = config;

	return {

		debug: (message) => {

			if (!this.config.debug)
				return;

			console.log('[Botanalytics] ' + message);
		},

		error: (message, err) => {

			console.log('[Botanalytics] Error: ' + [message, util.inspect(err)].join(' ').trim());
		},

		checkResponse: (resp, successMessage, errorMessage) => {

			if (resp.toJSON().statusCode == 200 || resp.toJSON().statusCode == 201) {

				if (this.config.debug)
					console.log('[Botanalytics] ' + successMessage);

				return null;
			}

			console.log('[Botanalytics] ' + [errorMessage, 'Response status code: ' + resp.toJSON().statusCode].join(' ').trim());

			switch(resp.toJSON().statusCode) {

				case 400:
					return new Error('The request was unacceptable. This is often due to missing a required parameter.');
					break;
				case 401:
					return new Error('Your API token is invalid.');
					break;
				case 404:
					return new Error('Requested resource does not exist. Please check your \'baseUrl\' configuration.');
					break;
				default:
					return new Error('Something went wrong on Botanalytics\'s end. Try again later.');
			}
		}
	}	
}
