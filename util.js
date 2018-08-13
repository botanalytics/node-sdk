const util = require('util');
const objectPath = require('object-path');

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

		    const response = resp.toJSON();

			if (response.statusCode === 200 || response.statusCode === 201) {

				if (this.config.debug)
					console.log('[Botanalytics] ' + successMessage);

				return null;
			}

			console.log('[Botanalytics] ' + [errorMessage, 'Response status code: ' + response.statusCode].join(' ').trim());
            let errorString = response.body && response.body.error_message ? response.body.error_message : response.body;
            switch(response.statusCode) {
                case 207:
                    return new Error(`ERROR: ${errorString}`);
                case 400:
                    return new Error(`The request was unacceptable. This is often due to missing a required parameter. ERROR:${errorString}`);
                case 401:
                    return new Error('Your API token is invalid.');
                case 404:
                    return new Error('Requested resource does not exist. Please check your \'baseUrl\' configuration.');
                case 406:
                    return new Error(`The request was unacceptable. This is often due to missing a required parameter. ERROR:${errorString}`);
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

exports.SlackFetcher = function (botanalyticsToken, slackBotToken, config) {

	if(!botanalyticsToken || !slackBotToken || !config)
		console.log("Missing parameter!");

	this._botanalyticsToken = botanalyticsToken;
	this._slackBotToken = slackBotToken;
	this._config = Object.assign({
        baseUrl: 'https://api.botanalytics.co/v1/',
        debug: false
    }, config);

    this._request = require('request').defaults({
        baseUrl: this._config.baseUrl,
        headers: {
            'Authorization': 'Token ' + encodeURIComponent(this._botanalyticsToken),
            'Content-Type': 'application/json'
        }
    });
    this._init = function (data) {

        const self = this;
        //send
        self._request({

            url: '/bots/slack/initialize/',
            method: 'POST',
            json: true,
            headers: {
                'Authorization': 'Token '+encodeURIComponent(self._botanalyticsToken),
                'Content-Type': 'application/json'
            },
            body: data


        }, (err, resp, payload) => {

            if(err) {
                console.error(`Failed to log team info message for slack bot token : ${self._slackBotToken}`, err);
                setTimeout(self._init.bind(self, data), 10000);
            }
            else{
                setInterval(self.fetch.bind(self), 3600000);
				if(self._config.debug)
					console.log(`Updating team info for ${self._slackBotToken}`);
            }
        });
    };
    this.fetch = function () {
        const self = this;
        // check rtm start
        require("request").post({url : "https://slack.com/api/rtm.start", form : {token : self._slackBotToken}}, function (err, resp, body) {

            const data = JSON.parse(body);
            if(err || data.ok === false)
                setTimeout(self.fetch.bind(self), 10000);
            else{
                self._init(data);
            	if(self._config.debug)
            		console.log(`Fetched team info for ${self._slackBotToken}`);
			}
        });
    };
    return this;
};