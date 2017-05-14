const util = require('util');
const objectPath = require('object-path');
const Base = require('./base');
const Promise = require('bluebird');

class Google extends Base {
  isDataValid(data) {
    const inputs = objectPath.get(data, 'originalRequest.data.inputs');

    if (!inputs || !inputs.length)
      return false;

    for (var i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const arguments_ = objectPath.get(input, 'arguments');

      if (!arguments_ || !arguments_.length)
        return false;

      for (var j = 0; j < arguments_.length; j++) {
        const argument = arguments_[j];

        if (objectPath.get(argument, 'name') === 'is_health_check' && objectPath.get(argument, 'text_value') === '1')
          return true;
      }
    }

    return false;
  }

  logIncomingMessage(data, callback) {
    this.log.debug('Logging incoming message: ' + util.inspect(data));

    if (this.isDataValid(data)) {
      this.log.debug('Ignoring health check...');
      callback && callback();
      return Promise.resolve();
    }

    objectPath.set(data, 'timestamp', new Date().getTime());

    return new Promise((resolve, reject) => {
      this.request({
        url: '/messages/user/google-assistant/',
        method: 'POST',
        json: true,
        body: {
          message: data
        }
      }, (err, resp, payload) => {
        if (err) {
          this.log.error('Failed to log incoming message.', err);
          callback && callback(new Error('Failed to log incoming message'));
          return reject(new Error('Failed to log incoming message'));
        }

        const message = this.log.checkResponse(resp, 'Successfully logged incoming message.', 'Failed to log incoming message.');

        callback && callback(null, message);
        resolve(message);
      });
    });
  }

  logOutgoingMessage(requestData, responseData, callback) {
    let userId, conversationId;

    if (objectPath.has(requestData, 'originalRequest')) {
      userId = objectPath.get(requestData, 'originalRequest.data.user.user_id');
      conversationId = objectPath.get(requestData, 'originalRequest.data.conversation.conversationId');
    } else {
      userId = objectPath.get(requestData, 'user.user_id');
      conversationId = objectPath.get(requestData, 'conversation.conversation_id');
    }

    this.log.debug('Logging incoming message: ' + util.inspect(responseData));

    return new Promise((resolve, reject) => {
      this.request({
        url: '/messages/bot/google-assistant/',
        method: 'POST',
        json: true,
        body: {
          message: responseData,
          user: {
            user_id: userId
          },
          conversation: {
            conversation_id: conversationId
          }
        }
      }, (err, resp, payload) => {
        if (err) {
          this.log.error('Failed to log outgoing message.', err);
          callback && callback(new Error('Failed to log outgoing message'));
          return reject(new Error('Failed to log outgoing message'));
        }

        const message = this.log.checkResponse(resp, 'Successfully logged outgoing message.', 'Failed to log outgoing message.');

        callback && callback(null, message);
        resolve(message);
      });
    });
  }

  attach(assistant, callback) {
    if (!assistant) {
      callback && callback(new Error('You must provide an assistant object.'));
      return Promise.reject(new Error('You must provide an assistant object.'));
  }

    this.assistant = assistant;
    this.assistant.originalDoResponse = assistant.doResponse_;
    this.assistant.doResponse_ = (responseData, responseCode) => {
      this.logOutgoingMessage(this.requestData, responseData, callback);
      this.assistant.originalDoResponse(responseData, responseCode);
    };

    this.requestData = assistant.body_;

    return this.logIncomingMessage(assistant.body_, callback);
  }
}

module.exports = Google;
