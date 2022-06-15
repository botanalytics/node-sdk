// Imports
import BaseClient from './base.js';

// Constants
const channelId = 'universal';

// Universal channel client
export default class UniversalClient extends BaseClient {

    constructor(options) {

        super(Object.assign({
            _channel: 'universal'
        }, options))
    }

    async logMessage(message) {

        await this._sendMessages(message)
    }

    async logMessages(messages) {

        await this._sendMessages(...messages)
    }
}
