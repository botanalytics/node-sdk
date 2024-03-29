// Imports
import 'dotenv/config'
import pino from 'pino';
import got from 'got';
import { getVersion } from './util.cjs'

// Defaults
const defaultBaseUrl = 'https://api.beta.botanalytics.co/v2';
const defaultLogLevel = 'info'
const defaultRequestTimeout = 30000;
const defaultRequestRetryLimit = 10;

// Configure a pino instance
const logger = pino({
    level: process.env.BA_LOG_LEVEL || defaultLogLevel
});

// Base for different platform clients
export default class BaseClient {

    constructor(options) {

        // Check for API key
        if ((!options || !options.apiKey) && !process.env.BA_API_KEY) {

            logger.error("API key parameter is required.")

            throw new Error("API key parameter is required.")
        }

        // Check for channel
        if (!options || !options._channel)
            throw new Error("Internal inconsistency.")

        // Store arguments
        this._apiKey = options.apiKey || process.env.BA_API_KEY;
        this._baseUrl = (options && options.baseUrl) || process.env.BA_BASE_URL || defaultBaseUrl;
        this._channel = options._channel;

        // Store logger
        this.logger = logger;

        // Basic validation for API key
        this._validateApiKey()

        // Create HTTP client instance
        this._httpClient = got.extend({
            prefixUrl: this._baseUrl,
            method: 'POST',
            responseType: 'json',
            followRedirect: false,
            headers: {
                'Authorization': 'Bearer ' + this._apiKey,
                'X-Botanalytics-Client-Id': 'node',
                'X-Botanalytics-Client-Version': getVersion()
            },
            retry: {
                limit: (options && options.hasOwnProperty('requestRetryLimit')) ? options.requestRetryLimit : ((process.env.BA_REQUEST_RETRY_LIMIT && parseInt(process.env.BA_REQUEST_RETRY_LIMIT)) || defaultRequestRetryLimit),
                methods: [
                    'GET',
                    'POST',
                    'PUT',
                    'HEAD',
                    'DELETE',
                    'OPTIONS',
                    'TRACE'
                ],
                errorCodes: [
                    'ETIMEDOUT',
                    'ECONNRESET',
                    'EADDRINUSE',
                    'ECONNREFUSED',
                    'EPIPE',
                    'ENOTFOUND',
                    'ENETUNREACH',
                    'EAI_AGAIN'
                ]
            },
            timeout: {
                request: (options && options.requestTimeout) && (process.env.BA_REQUEST_TIMEOUT && parseInt(process.env.BA_REQUEST_TIMEOUT)) || defaultRequestTimeout
            },
            hooks: {
                beforeRetry: [
                    async (err, count) => {

                        logger.info("Retrying sending data (attempt %d)...", count)
                    }
                ],
                beforeError: [
                    async (err) => {

                        logger.warn("Failed to send data.", err);

                        return err;
                    }
                ]
            }
        });
    }

    _validateApiKey() {

        // Split token
        let tokenParts = this._apiKey.split('.');

        // Check token parts size
        if (!tokenParts || tokenParts.length < 2) {

            logger.error("API key is not a valid JWT.")

            throw new Error("API key is not a valid JWT.")
        }

        // Get the first part
        let firstPart = tokenParts[1];

        // Convert token JSON to string
        let tokenStr = Buffer.from(firstPart, 'base64').toString('utf-8')

        // Parse token string
        let tokenJson;
        try {

            tokenJson = JSON.parse(tokenStr);

        } catch (err) {

            logger.error("API key is not a valid JWT.")

            throw new Error("API key is not a valid JWT.")
        }

        // Check if channel field exists
        if (!tokenJson || !tokenJson.channel) {

            logger.error("API key is missing a channel claim.")

            throw new Error("API key is missing a channel claim.")
        }

        // Check if channel field matches
        if (tokenJson.channel !== this._channel) {

            logger.error("API key does not match the client channel.")

            throw new Error("API key does not match the client channel.")
        }
    }

    async _sendMessages(...messages) {

        // Sanity check
        if (messages.length === 0) {

            this.logger.debug('Message array is empty, ignoring send request...')

            return
        }

        // Create a request body
        let requestBody = {
            messages: messages
              .map(message => Object.assign({}, { message }))
        }

        // Send the data
        try {

            // Get the response
            const data = await this._httpClient.post('messages', {
                json: requestBody
            }).json()

            // Log request ID if available
            if (data && data.request_id)
                logger.debug('Message(s) successfully sent with the request ID \'%s\'.', data.request_id)

        } catch (e) {

            // Get important fields
            let { code, response } = e;

            // Check code
            switch (code) {

                case 'ERR_NON_2XX_3XX_RESPONSE':

                    // Get actual HTTP code
                    let { statusCode, body } = response;

                    // Check for known status codes
                    if (statusCode === 400) {

                        logger.warn('Request considered invalid by the API server.')

                    } else if (statusCode === 401) {

                        logger.warn('Request considered unauthorized by the API server.')
                    }

                    // Get error and warning messages
                    let { errors, warnings } = body;

                    // Check for errors in the response
                    if (errors && errors.length)
                        for (const errorMessage of errors)
                            logger.error('Received error: %s', errorMessage)

                    // Check for warnings in the response
                    if (warnings && warnings.length)
                        for (const warningMessage of warnings)
                            logger.error('Received warning: %s', warningMessage)

                    break;

                case 'ETIMEDOUT':
                    logger.warn('Request failed due to timeout.')
                    break;

                case 'ERR_CANCELED':
                    logger.warn('Request cancelled.')
                    break;

                case 'ERR_BODY_PARSE_FAILURE':
                    logger.warn('API server responded but we failed to parse the response body.')
                    break;

                default:
                    logger.warn('Request failed due to an underlying network problem.')
            }
        }
    }
}
