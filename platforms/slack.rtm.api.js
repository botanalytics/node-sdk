const util = require('util');
const BotanalyticsUtil = require("../util");
const EVENTS_MESSAGE = 'message';

module.exports = function(token, userConfig) {

    // Check token
    if (!token || token.constructor !== String)
        throw new Error('You must provide a Botanalytics token!');

    // Create default config
    const config = {
        baseUrl: 'https://api.botanalytics.co/v1/',
        debug: false
    };

    // Merge user configuration into the default config
    Object.assign(config, userConfig);

    const log = new BotanalyticsUtil.Logger(config);

    log.debug('Logging enabled.');

    log.debug('Configuration: ' + util.inspect(config));

    // Configure request defaults
    const request = require('request').defaults({
        baseUrl: config.baseUrl,
        headers: {
            'Authorization': 'Token ' + encodeURIComponent(token),
            'Content-Type': 'application/json'
        }
    });

    return {

        attach: (rtm, callback) => {

            // Check rtm object
            if (!rtm) {

                const err = new Error('You must provide a RTM object!');

                if (callback)
                    return callback(err);
                else
                    return err;
            }

            new BotanalyticsUtil.SlackFetcher(token, rtm._token).fetch();

            this.rtmRef = rtm;
            this.rtmRef.originalSendMessage = rtm.sendMessage;

            this.rtmRef.sendMessage = function(text, channel, cb) {

                log.debug('Logging outgoing message: ' + text);

                this.originalSendMessage(text,channel,cb);

                const payload = {
                    message: {
                        type: "message",
                        channel: channel,
                        user: this.activeUserId,
                        ts: (new Date().getTime() / 1000) + "",
                        team: this.activeTeamId
                    }
                };

                request({

                    url: '/messages/slack/',
                    method: 'POST',
                    json: true,
                    body: payload

                }, (err, resp, payload) => {

                    if (err) {

                        log.error('Failed to log outgoing message.', err);

                        if (callback)
                            callback(new Error('Failed to log outgoing message'));

                        return;
                    }

                    err = log.checkResponse(resp, 'Successfully logged outgoing message.', 'Failed to log outgoing message.');

                    if (callback)
                        callback(err);
                });
            };

            // Attach to authenticated event
/*            rtm.on(EVENTS_AUTHENTICATED, (rtmStartData) => {

                log.debug('Initializing bot: ' + util.inspect(rtmStartData));

                request({

                    url: '/bots/slack/initialize/',
                    method: 'POST',
                    json: true,
                    body: rtmStartData

                }, (err, resp, payload) => {

                    if (err) {

                        log.error('Failed to initialize bot.', err);

                        if (callback)
                            callback(new Error('Failed to initialize bot'));

                        return;
                    }

                    err = log.checkResponse(resp, 'Successfully initialized bot.', 'Failed to initialize bot.');

                    if (callback)
                        callback(err);
                });
            });*/

            // Attach to message event
            rtm.on(EVENTS_MESSAGE, (message) => {

                log.debug('Logging incoming message: ' + util.inspect(message));

                request({

                    url: '/messages/slack/',
                    method: 'POST',
                    json: true,
                    body: {
                        message: message
                    }

                }, (err, resp, payload) => {

                    if (err) {

                        log.error('Failed to log incoming message.', err);

                        if (callback)
                            callback(new Error('Failed to log incoming message'));

                        return;
                    }

                    err = log.checkResponse(resp, 'Successfully logged incoming message.', 'Failed to log incoming message.');

                    if (callback)
                        callback(err);
                });
            });
        }
    };
};