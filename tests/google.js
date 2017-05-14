const chai = require('chai');
const expect = chai.expect;
const Google = require('../platforms/google');
const RequestMock = require('./mocks/request');
const LogMock = require('./mocks/log');

describe('GoogleAssistant', () => {
  beforeEach(() => {
    this.instance = new Google('BOTANALYTICS_TOKEN');
    this.instance.log = LogMock;
  });

  describe('attach', () => {
    it('should throw error on missing assistant', () => {
      this.instance.attach(null)
        .catch((error) => {
          expect(error).to.be.an.instanceOf(Error);
          expect(error.message).to.equal('You must provide an assistant object.');
        });
    });

    it('should initialize properly', () => {
      this.instance.attach({body_: {}})
      .catch((error) => {
        expect(error).to.equal(null);
      });
    });
  });

  describe('logIncomingMessage', () => {
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
      const data = {
        originalRequest: {
          data: {
            inputs: [ {input: 1}, {input: 2} ]
          }
        }
      };

      this.instance
        .logIncomingMessage(data)
        .then(response => {
          expect(response).to.equal(null);
        });
    });
  });

  describe('logOutgoingMessage', () => {
    it('should throw error on faulty response', () => {
      this.instance.request = RequestMock.invalid;

      this.instance
        .logOutgoingMessage({})
        .catch(error => {
          expect(error).to.be.an.instanceOf(Error);
          expect(error.message).to.equal('Failed to log outgoing message');
        });
    });

    it('should accept valid response', () => {
      this.instance.request = RequestMock.valid;

      this.instance
        .logOutgoingMessage({})
        .then(response => {
          expect(response).to.equal(null);
        });
    });
  });
});