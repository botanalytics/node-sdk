// Imports
import 'dotenv/config'
import pino from 'pino';
import got from 'got';

// Configure a pino instance
const logger = pino();

// Defaults
const defaultBaseUrl = 'https://api.botanalytics.co';
const defaultRequestTimeout = 30000;
const defaultRetryLimit = 10;

// Base for different platform clients
export default class Base {

    constructor(options) {

        // Check for API key
        if (!process.env.API_KEY && (!options || !options.apiKey)) {

            logger.error("API key parameter is required.");

            process.exit(1);
        }

        // Store arguments
        this.apiKey = process.env.API_KEY || options.apiKey;
        this.baseUrl = process.env.BASE_URL || (options && options.baseUrl) || defaultBaseUrl;
        this.logger = logger;

        // Create HTTP client instance
        this.httpClient = got.extend({
            prefixUrl: this.baseUrl,
            method: 'POST',
            responseType: 'json',
            followRedirect: false,
            headers: {
                'Authorization': 'Bearer ' + this.apiKey
            },
            retry: {
                limit: (process.env.RETRY_LIMIT && parseInt(process.env.RETRY_LIMIT)) || (options && options.retryLimit) || defaultRetryLimit,
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
                request: (process.env.REQUEST_TIMEOUT && parseInt(process.env.REQUEST_TIMEOUT)) || (options && options.requestTimeout) || defaultRequestTimeout
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
}
