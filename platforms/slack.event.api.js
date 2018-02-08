'use strict';
const util = require('util');
const req = require('request');

module.exports = function (token, slackBotToken, userConfig) {
    // Check token
    if(!token || token.constructor !== String)
        throw new Error('You must provide a Botanalytics token!');
    this.token = token;
    //check slack token
    if(!slackBotToken || slackBotToken.constructor !== String)
        throw new Error('You must provide a Slack bot token!');
    this.slackBotToken = slackBotToken;
    // Merge user configuration into the default config
    this._config = Object.assign({
        debug: false,
        baseUrl : "https://api.botanalytics.co/v1"
    }, userConfig);
    //state definers
    this._isInited = false;
    this._isFetched = false;
    //logger
    this._logger = new require('../util').Logger(this._config);
    this._logger.debug('Logging enabled.');
    this._logger.debug('Configuration: ' + util.inspect(this._config));

    this._init = function (data) {

        if(!this._isInited){
            //context referencing
            const self = this;
            //send
            req({

                url: self._config.baseUrl+'/bots/slack/initialize/',
                method: 'POST',
                json: true,
                headers: {
                    'Authorization': 'Token '+encodeURIComponent(self.token),
                    'Content-Type': 'application/json'
                },
                body: {
                    message: JSON.parse(data)
                }

            }, (err, resp, payload) => {

                if(err) {
                    self._logger.error('Failed to log init message.', err);
                    self._logger.debug('Retrying...');
                    setTimeout(self._init.bind(self, data), 10000);
                }
                else{
                  self._isInited = true;
                }

            });
        }
    };
    this._fetch = function () {
        if(!this._isFetched){
            const self = this;
            // check rtm start
            req.post({url : "https://slack.com/api/rtm.start", form : {token : self.slackBotToken}}, function (err, resp, body) {

                if(JSON.parse(body).ok === false) {
                    setTimeout(self._fetch.bind(self), 10000);
                    self._logger.debug(body);
                }
                else {
                    self._init(body);
                    self._isFetched = true;
                }
            });
        }
    };
    //init info message
    this._fetch();

    this.log = function (message) {

        if (!message || message.constructor !== Object) {

            this._logger.error('Message object is not provided!');
            return;
        }

        if(message.type === "url_verification" || message.type !== "event_callback" || message.type!=="interactive_message"){
            this._logger.debug(`Ignoring ${message.type} message.`);
            return;
        }
        const self = this;
        //log incoming message
        self._logger.debug('Logging incoming message...\n' + util.inspect(message));
        // create copy of the message
        const payload = Object.assign({}, message);
        if (payload.type === "interactive_message")
            req({

                url: self._config.baseUrl+'/messages/slack/interactive/',
                method: 'POST',
                json: true,
                headers: {
                    'Authorization': 'Token ' + encodeURIComponent(self.token),
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
        else
            req({

                url: self._config.baseUrl+'/messages/slack/event/',
                method: 'POST',
                json: true,
                headers: {
                    'Authorization': 'Token ' + encodeURIComponent(self.token),
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
    };
    
    return this;
};