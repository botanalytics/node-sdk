const util = require('util');
const objectPath = require('object-path');
const request = require("request");

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
};

exports.setIfAvailable = (sourceObj, destObj, propertyName) => {

	if (objectPath.has(sourceObj, propertyName))
		objectPath.set(destObj, propertyName, objectPath.get(sourceObj, propertyName));
};

exports.SlackFetcher = function (botanalyticsToken, slackBotToken) {

	this._botanalyticsToken = botanalyticsToken;
	this._slackBotToken = slackBotToken;
    this._init = function (data) {

        const self = this;
        //send
        request({

            url: 'https://api.botanalytics.co/v1/bots/slack/initialize/',
            method: 'POST',
            json: true,
            headers: {
                'Authorization': 'Token '+encodeURIComponent(self._botanalyticsToken),
                'Content-Type': 'application/json'
            },
            body: JSON.parse(data)


        }, (err, resp, payload) => {

            if(err) {
                console.error(`Failed to log team info message for slack bot token : ${self._slackBotToken}`, err);
                setTimeout(self._init.bind(self, data), 10000);
            }
            else
                setInterval(self.fetch.bind(self), 3600000);

        });
    };
    this.fetch = function () {
        const self = this;
        // check rtm start
        request.post({url : "https://slack.com/api/rtm.start", form : {token : self._slackBotToken}}, function (err, resp, body) {

            if(JSON.parse(body).ok === false)
                setTimeout(self.fetch.bind(self), 10000);
            else
                self._init(body);

        });
    };
    return this;
};