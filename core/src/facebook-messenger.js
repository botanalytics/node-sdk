// Imports
import BaseClient from './base.js';

// Constants
const channelId = 'facebook-messenger';

// Facebook Messenger channel client
export default class FacebookMessengerClient extends BaseClient {

    constructor(options) {

        super(Object.assign({
            _channel: channelId
        }, options))
    }

    /**
     * Logs messages in a Messenger webhook request payload.
     *
     * @param webhookPayload Webhook request body including the top-level 'object' field
     * @returns {Promise<void>}
     */
    async logWebhookMessages(webhookPayload) {

        // Ensure that the top level object field is present
        if (!webhookPayload || !webhookPayload.object) {

            this.logger.error('Please log the webhook request body as-is, including the top level \'object\' field.')

            return
        }

        // Check if object is page
        if (webhookPayload.object !== 'page') {

            this.logger.debug('Unknown object type %s, ignoring...', webhookPayload.object)

            return
        }

        // Log entry items if available
        if (webhookPayload.entry && webhookPayload.entry.length)
            await this._sendMessages(...Array.from(webhookPayload.entry))
    }

    /**
     * Logs a message that will be sent via the Messenger Send API.
     *
     * @param sendApiPayload Send API request payload
     * @returns {Promise<void>}
     */
    async logSendApiMessage(sendApiPayload) {

        // Ensure that required recipient field is available
        if (!sendApiPayload || !sendApiPayload.recipient) {

            this.logger.error('Please log the Send API request body as-is, including the top level \'recipient\' field.')

            return
        }

        // Ensure that one of the required message or sender_action fields is available
        if (!sendApiPayload.message && !sendApiPayload.sender_action) {

            this.logger.error('Please log the Send API request body as-is, including the top level \'message\' or \'sender_action\' field.')

            return
        }

        // Add timestamp if not present
        if (!sendApiPayload.timestamp)
            sendApiPayload.timestamp = Date.now();

        // Log Send API request
        await this._sendMessages(sendApiPayload)
    }

    /**
     * Express middleware to be used for automatically logging webhook requests.
     *
     * Ensure that this middleware is only configured for the webhook routes.
     *
     * @returns {(function(*, *, *))|*}
     */
    middleware() {

        return (function (req, res, next) {

            if (req && req.body && req.method === 'POST')
                this.logWebhookMessages(req.body)

            next()

        }).bind(this);
    }
}
