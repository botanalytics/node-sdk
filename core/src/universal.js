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

    async logMessages(...messages) {

        await this._sendMessages(...messages)
    }

    async _validateMessages(messages) {

        // Sanity check
        if (!messages || !messages.length) {

            this.logger.error("Messages are missing.")

            throw new Error("Messages are missing.")
        }

        // Iterate over messages
        for (const message of messages) {

            // Check if message field is present
            if (!message || !message.messages) {

                this.logger.error('Message is missing a \'message\' field.')

                throw new Error('Message is missing a \'message\' field.')
            }

            // Get inner message field
            let innerMessage = message.message;

            // Check if message field is present
            if (!innerMessage.messages) {

                this.logger.error('Message is missing a \'message\' field.')

                throw new Error('Message is missing a \'message\' field.')
            }
        }
    }
}
