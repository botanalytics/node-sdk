const chai = require('chai');
const expect = chai.expect;
const Base = require('../platforms/base');

describe('Base', () => {
  beforeEach(() => {
    this.instance = new Base('BOTANALYTICS_TOKEN');
  });

  it('should throw error on invalid or missing token', () => {
    const faulty = () => {
      new Base();
    };

    expect(faulty).to.throw(Error, /You must provide a Botanalytics token!/);
  });

  it('should have necessary configs', () => {
    const { baseUrl, debug } = this.instance.config;
    expect(baseUrl).to.equal('https://botanalytics.co/api/v1/');
    expect(debug).to.equal(false);
  });

  it('should have a valid logger', () => {
    const { log } = this.instance;
    expect(log).to.exist;
    expect(log).to.be.a('object');
  });

  it('should have a valid request instance', () => {
    const { request } = this.instance;
    expect(request).to.exist;
    expect(request).to.be.a('function'); 
  });
});