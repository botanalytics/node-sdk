'use strict';
const util = require('util');
const request = require('request');
const BotanalyticsUtil = require("../util");

module.exports = function (token, slackBotToken, userConfig) {
    // Check token
    if(!token || token.constructor !== String)
        throw new Error('You must provide a Botanalytics token!');
    this._token = token;
    //check slack token
    if(!slackBotToken || slackBotToken.constructor !== String)
        throw new Error('You must provide a Slack bot token!');

    // Merge user configuration into the default config
    this.config = Object.assign({
        debug: false,
        baseUrl : "https://api.botanalytics.co/v1/"
    }, userConfig);
    //logger
    this._logger = new BotanalyticsUtil.Logger(this.config);
    this._logger.debug('Logging enabled.');
    this._logger.debug('Configuration: ' + util.inspect(this.config));

    this._req = request.defaults({
        baseUrl: this.config.baseUrl,
        headers: {
            'Authorization': 'Token ' + encodeURIComponent(token),
            'Content-Type': 'application/json'
        }
    });

    new BotanalyticsUtil.SlackFetcher(this._token, slackBotToken).fetch();

    this.log = function (message) {

        if (!message || message.constructor !== Object) {

            this._logger.error('Message object is not provided!');
            return;
        }

        if (message.type === "interactive_message"){

            const self = this;
            //log incoming message
            self._logger.debug('Logging incoming message...\n' + util.inspect(message));
            // create copy of the message
            const payload = Object.assign({}, message);
            //log
            self._req({

                url: '/messages/slack/interactive/',
                method: 'POST',
                json: true,
                headers: {
                    'Authorization': 'Token ' + encodeURIComponent(self._token),
                    'Content-Type': 'application/json'
                },
                body: payload

            }, (err, resp, payload) => {

                if (err) {

                    self._logger.error('Failed to log incoming message.', err);

                } else {

                    err = self._logger.checkResponse(resp, 'Successfully logged incoming message.', 'Failed to log incoming message.');

                    if (err) {

                        self._logger.error('Failed to log incoming message.', err);
                    }
                }
            });
        }
        else if (message.type === "event_callback"){

            const self = this;
            //log incoming message
            self._logger.debug('Logging incoming message...\n' + util.inspect(message));
            // create copy of the message
            const payload = Object.assign({}, message);

            self._req({

                url: '/messages/slack/event/',
                method: 'POST',
                json: true,
                headers: {
                    'Authorization': 'Token ' + encodeURIComponent(self._token),
                    'Content-Type': 'application/json'
                },
                body: payload

            }, (err, resp, payload) => {

                if (err) {

                    self._logger.error('Failed to log incoming message.', err);

                } else {

                    err = self._logger.checkResponse(resp, 'Successfully logged incoming message.', 'Failed to log incoming message.');

                    if (err) {

                        self._logger.error('Failed to log incoming message.', err);
                    }
                }
            });
        }
        else
            this._logger.debug(`Ignoring ${message.type} message.`);

    };
    
    return this;
};