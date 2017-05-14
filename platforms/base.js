const util = require('util');
const request = require('request');


class Base {
  constructor(token, opt_config = {}) {
		if (!token) {
			throw new Error('You must provide a Botanalytics token!');
		}

    this.token = token;
		this.config = {
			baseUrl: 'https://botanalytics.co/api/v1/',
			debug: false
		};

		Object.assign(this.config, opt_config);

    this.log = new require('../util').Logger(this.config);

		this.log.debug('Logging enabled.');
		this.log.debug(`Configuration: ${util.inspect(this.config)}`)

		this.request = request.defaults({
			baseUrl: this.config.baseUrl,
			headers: {
				'Authorization': `Token ${encodeURIComponent(this.token)}`,
				'Content-Type': 'application/json'
			}
		});
	}
}

module.exports = Base;