const chai = require('chai');
const expect = chai.expect;
const Facebook = require('../platforms/facebook');
const RequestMock = require('./mocks/request');
const LogMock = require('./mocks/log');

describe('FacebookMessenger', () => {
  beforeEach(() => {
    this.instance = new Facebook('BOTANALYTICS_TOKEN');
    this.instance.log = LogMock;
  });

  describe('logIncomingMessage', () => {
    it('should throw error on invalid data', () => {
      this.instance
        .logIncomingMessage()
        .catch(error => {
          expect(error).to.be.an.instanceOf(Error);
          expect(error.message).to.equal('Message data is required.');
        });
    });

    it('should throw error on faulty response', () => {
      this.instance.request = RequestMock.invalid;

      this.instance
        .logIncomingMessage({data: 'data'})
        .catch(error => {
          expect(error).to.be.an.instanceOf(Error);
          expect(error.message).to.equal('Failed to log incoming message');
        });
    });

    it('should accept valid response', () => {
      this.instance.request = RequestMock.valid;

      this.instance
        .logIncomingMessage({data: 'data'})
        .then(response => {
          expect(response).to.equal(null);
        });
    });
  });

  describe('logOutgoingMessage', () => {
    it('should throw error on invalid data', () => {
      this.instance
        .logOutgoingMessage()
        .catch(error => {
          expect(error).to.be.an.instanceOf(Error);
          expect(error.message).to.equal('Message data, receipient and token is required.');
        });
    });

    it('should throw error on faulty response', () => {
      this.instance.request = RequestMock.invalid;

      this.instance
        .logOutgoingMessage({data: 'data'}, {}, {})
        .catch(error => {
          expect(error).to.be.an.instanceOf(Error);
          expect(error.message).to.equal('Failed to log outgoing message');
        });
    });

    it('should accept valid response', () => {
      this.instance.request = RequestMock.valid;

      this.instance
        .logOutgoingMessage({data: 'data'}, {}, {})
        .then(response => {
          expect(response).to.equal(null);
        });
    });
  });

  describe('logUserProfile', () => {
    it('should throw error on invalid data', () => {
      this.instance
        .logUserProfile()
        .catch(error => {
          expect(error).to.be.an.instanceOf(Error);
          expect(error.message).to.equal('User data is required.');
        });
    });

    it('should throw error on faulty response', () => {
      this.instance.request = RequestMock.invalid;

      this.instance
        .logUserProfile({data: 'data'})
        .catch(error => {
          expect(error).to.be.an.instanceOf(Error);
          expect(error.message).to.equal('Failed to log user profile.');
        });
    });

    it('should accept valid response', () => {
      this.instance.request = RequestMock.valid;

      this.instance
        .logUserProfile({data: 'data'})
        .then(response => {
          expect(response).to.equal(null);
        });
    });
  });
});