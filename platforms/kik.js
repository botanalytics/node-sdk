const util = require('util');
const objectPath = require('object-path');

const setIfAvailable = require('../util').setIfAvailable;

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

    log.debug('Configuration: ' + util.inspect(config))

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

        attach: (bot, callback) => {

            // Check rtm object
            if (!bot) {

                const err = new Error('You must provide a bot object!');

                if (callback)
                    return callback(err);
                else
                    return err;
            }

            // Track incoming messages
            bot.use((message, next) => {

                log.debug('Logging incoming message: ' + util.inspect(message));

                let payload = {
                    chatId: objectPath.get(message, '_state.chatId'),
                    id: objectPath.get(message, '_state.id'),
                    type: objectPath.get(message, '_state.type'),
                    from: objectPath.get(message, '_state.from'),
                    timestamp: objectPath.get(message, '_state.timestamp'),
                    chatType: objectPath.get(message, '_state.chatType'),
                    mention: objectPath.get(message, '_state.mention', null)
                };

                setIfAvailable(message._state, payload, 'participants');
                setIfAvailable(message._state, payload, 'readReceiptRequested');
                setIfAvailable(message._state, payload, 'stickerPackId');

                //http://www.hongkiat.com/blog/wordpress-url-rewrite/
                setIfAvailable(message._state, payload, 'chatId');
                setIfAvailable(message._state, payload, 'picUrl');
                setIfAvailable(message._state, payload, 'stickerUrl');
                setIfAvailable(message._state, payload, 'videoUrl');
                setIfAvailable(message._state, payload, 'body');
                setIfAvailable(message._state, payload, 'messageIds');
                setIfAvailable(message._state, payload, 'data');
                setIfAvailable(message._state, payload, 'isTyping');
                setIfAvailable(message._state, payload, 'picked');

                request({

                    url: '/messages/kik/',
                    method: 'POST',
                    json: true,
                    body: {
                        messages: [
                            payload
                        ]
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

                next();
            });

            // Track outgoing messages
            bot.outgoing((message, next) => {

                log.debug('Logging outgoing message: ' + util.inspect(message));

                let payload = {
                    chatId: message.chatId,
                    type: message.type,
                    from: message.from,
                    to: message.to,
                    timestamp: Math.floor(Date.now())
                };

                setIfAvailable(message, payload, 'participants');
                setIfAvailable(message, payload, 'readReceiptRequested');
                setIfAvailable(message, payload, 'stickerPackId');

                //http://www.hongkiat.com/blog/wordpress-url-rewrite/
                setIfAvailable(message, payload, 'chatId');
                setIfAvailable(message, payload, 'picUrl');
                setIfAvailable(message, payload, 'stickerUrl');
                setIfAvailable(message, payload, 'videoUrl');
                setIfAvailable(message, payload, 'body');
                setIfAvailable(message, payload, 'messageIds');
                setIfAvailable(message, payload, 'data');
                setIfAvailable(message, payload, 'isTyping');
                setIfAvailable(message, payload, 'picked');
                setIfAvailable(message, payload, 'attribution');
                setIfAvailable(message, payload, 'loop');
                setIfAvailable(message, payload, 'muted');
                setIfAvailable(message, payload, 'autoplay');
                setIfAvailable(message, payload, 'url');

                request({

                    url: '/messages/kik/',
                    method: 'POST',
                    json: true,
                    body: {
                        messages: [
                            payload
                        ]
                    }

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

                next();
            });

        },

        logUserProfile(username, firstName, lastName, profilePicUrl, callback) {

            request({

                url: '/kik/users/',
                method: 'POST',
                json: true,
                body: {
                    username: username,
                    firstName: firstName,
                    lastName: lastName,
                    profilePicUrl: profilePicUrl
                }

            }, (err, resp, payload) => {

                if (err) {

                    log.error('Failed to log user profile.', err);

                    if (callback)
                        callback(new Error('Failed to log user profile'));

                    return;
                }

                err = log.checkResponse(resp, 'Successfully logged user profile.', 'Failed to log user profile.');

                if (callback)
                    callback(err);
            });
        }
    };
};