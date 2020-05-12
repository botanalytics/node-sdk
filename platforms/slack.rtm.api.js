const util = require('util');
const BotanalyticsUtil = require("../util");

module.exports = function(token, userConfig) {

    // Check token
    if (!token || token.constructor !== String)
        throw new Error('You must provide a Botanalytics token!');

    // Merge user configuration into the default config
    const config = Object.assign({
        baseUrl: 'https://api.botanalytics.co/v1/',
        debug: false
    }, userConfig);

    const log = new BotanalyticsUtil.Logger(config);

    log.debug('Logging enabled.');

    log.debug('Configuration: ' + util.inspect(config));

    // Configure request defaults
    const request = require('request').defaults({
        baseUrl: config.baseUrl,
        headers: {
            'Authorization': 'Token ' + encodeURIComponent(token),
            'Content-Type': 'application/json',
            'X-Botanalytics-Client-Id': 'node',
            'X-Botanalytics-Client-Version': require('../util').getVersion()()
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

            new BotanalyticsUtil.SlackFetcher(token, rtm._token, config).fetch();

            this.rtmRef = rtm;
            this.rtmRef.originalUpdateMessage = rtm.updateMessage;
            this.rtmRef.updateMessage = function(message,optCb){

                log.debug('Logging message update:'+message.text);

                this.originalUpdateMessage(message, optCb);

                const payload = {
                    type:'message',
                    channel : message.channel,
                    text : message.text,
                    user : this.activeUserId,
                    ts : (new Date().getTime() / 1000) + "",
                    team : this.activeTeamId,
                    is_bot: true
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

            this.rtmRef.originalSendTyping = rtm.sendTyping;

            this.rtmRef.sendTyping = function (channelId) {
                log.debug("Sending 'typing' message to channel:"+channelId);
                this.originalSendTyping(channelId);
                const payload = {
                    type: "typing",
                    text: "",
                    channel : channelId,
                    user : this.activeUserId,
                    ts : (new Date().getTime() / 1000) + "",
                    team : this.activeTeamId,
                    is_bot: true
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
            
            this.rtmRef.originalSendMessage = rtm.sendMessage;

            this.rtmRef.sendMessage = function(text, channel, cb) {

                log.debug('Logging outgoing message: ' + text);

                this.originalSendMessage(text,channel,cb);

                const payload = {
                    type: "message",
                    channel: channel,
                    text : text,
                    user: this.activeUserId,
                    ts: (new Date().getTime() / 1000) + "",
                    team: this.activeTeamId,
                    is_bot : true
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
            //Attach to user typing event
            rtm.on('user_typing', (message) => {

                log.debug('Logging incoming message: '+ util.inspect(message));
                request({

                    url: '/messages/slack/',
                    method: 'POST',
                    json: true,
                    body:  Object.assign({
                            is_bot:false,
                            text:"",
                            team:rtm.activeTeamId,
                            ts: (new Date().getTime() / 1000) + ""
                        }, message)
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
            // Attach to message event
            rtm.on('message', (message) => {

                log.debug('Logging incoming message: ' + util.inspect(message));

                request({

                    url: '/messages/slack/',
                    method: 'POST',
                    json: true,
                    body: Object.assign({is_bot:false, channel:rtm.activeChannelId, team: rtm.activeTeamId, user:rtm.activeUserId}, message)
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