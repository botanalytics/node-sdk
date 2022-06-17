// Imports
import BaseClient from './base.js';

// Constants
const channelId = 'amazon-alexa';

// Amazon Alexa channel client
export default class AmazonAlexaClient extends BaseClient {

    constructor(options) {

        super(Object.assign({
            _channel: channelId
        }, options))
    }

    requestInterceptor() {

        // Variable for referencing this
        const that = this;

        // Return interceptor object
        return {

            // Process function
            async process(handlerInput) {

                // Check if request envelope is available
                if (handlerInput.requestEnvelope) {

                    that.logger.debug('Logging request...')

                    // Send request envelope
                    await that._sendMessages(handlerInput.requestEnvelope)
                }
            }
        }
    }

    responseInterceptor() {

        // Variable for referencing this
        const that = this;

        // Return interceptor object
        return {

            // Process function
            async process(handlerInput, response) {

                // Check if response and request envelope are available
                if (response && handlerInput && handlerInput.requestEnvelope) {

                    that.logger.debug('Logging response...')

                    // Create a payload
                    let payload = Object.assign({}, response)

                    // Add timestamp
                    payload.timestamp = Date.now()

                    // Add request
                    payload.request = handlerInput.requestEnvelope;

                    // Send modified response
                    await that._sendMessages(payload)
                }
            }
        }
    }
}
