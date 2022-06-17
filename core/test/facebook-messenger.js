import * as assert from 'assert';
import nock from 'nock'
import {faker} from '@faker-js/faker'

import {FacebookMessengerClient} from '../src/index.js'

const baseUrl = 'https://api.botanalytics.co'
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJjaGFubmVsIjoiZmFjZWJvb2stbWVzc2VuZ2VyIn0.fYPMNanUdVYVyZaqwphg7jKj6VYUrG5_6oHIKaiNvXI'

describe('FacebookMessengerClient', function () {

    describe('logWebhookMessages', function () {

        it('should fail if object field is missing', async function () {

            await assert.rejects(() => {

                // Build client
                let client = new FacebookMessengerClient({
                    apiKey: token,
                    baseUrl: baseUrl
                })

                // Log webhook request
                return client.logWebhookMessages({})

            }, {
                name: 'Error',
                message: 'Missing object field.'
            })
        })

        it('should fail if object type is not page', async function () {

            await assert.rejects(() => {

                // Build client
                let client = new FacebookMessengerClient({
                    apiKey: token,
                    baseUrl: baseUrl
                })

                // Log webhook request
                return client.logWebhookMessages({
                    "object": "user"
                })

            }, {
                name: 'Error',
                message: 'Invalid object type.'
            })
        })

        it('should send all entries inside the webhook payload', async function () {

            // Create messages
            let messageJson1 = {
                id: faker.datatype.uuid(),
                name: faker.company.companyName()
            };
            let messageJson2 = {
                id: faker.datatype.uuid(),
                name: faker.company.companyName()
            };

            // Create nock scope
            const scope = nock(baseUrl)
              .post(/^\/messages/, {
                  messages: [
                      {
                          message: messageJson1
                      },
                      {
                          message: messageJson2
                      }
                  ]
              })
              .reply(200, {
                  request_id: faker.datatype.uuid()
              })

            // Build client
            let client = new FacebookMessengerClient({
                apiKey: token,
                baseUrl: baseUrl
            })

            // Log webhook request
            await client.logWebhookMessages({
                "object": "page",
                "entry": [
                    messageJson1,
                    messageJson2
                ]
            })

            // Validate nock interactions
            scope.done()
        })
    })

    describe('logSendApiMessage', function () {

        it('should fail if recipient field is missing', async function () {

            await assert.rejects(() => {

                // Build client
                let client = new FacebookMessengerClient({
                    apiKey: token,
                    baseUrl: baseUrl
                })

                // Log webhook request
                return client.logSendApiMessage({})

            }, {
                name: 'Error',
                message: 'Missing recipient field.'
            })
        })

        it('should fail if both of message and sender_action fields are missing', async function () {

            await assert.rejects(() => {

                // Build client
                let client = new FacebookMessengerClient({
                    apiKey: token,
                    baseUrl: baseUrl
                })

                // Log webhook request
                return client.logSendApiMessage({
                    "recipient": {
                        id: faker.datatype.uuid()
                    }
                })

            }, {
                name: 'Error',
                message: 'Missing message and sender_action fields.'
            })
        })

        it('should send payload by adding a timestamp', async function () {

            // Create message
            let messageJson = {
                "recipient": {
                    id: faker.datatype.uuid()
                },
                "message": {
                    "text": faker.lorem.text()
                }
            };

            // Create nock scope
            const scope = nock(baseUrl)
              .post(/^\/messages/, body => {

                  let first = body.messages.shift();

                  return first.message && first.message.timestamp && first.message.recipient && first.message.message.text;

              })
              .reply(200, {
                  request_id: faker.datatype.uuid()
              })

            // Build client
            let client = new FacebookMessengerClient({
                apiKey: token,
                baseUrl: baseUrl
            })

            // Log webhook request
            await client.logSendApiMessage(messageJson)

            // Validate nock interactions
            scope.done()
        })
    })

    describe('middleware', function () {

        it('should return an Express middleware that logs all incoming webhook requests',  function (done) {

            // Set timeout
            this.timeout(200)

            // Create messages
            let messageJson1 = {
                id: faker.datatype.uuid(),
                name: faker.company.companyName()
            };
            let messageJson2 = {
                id: faker.datatype.uuid(),
                name: faker.company.companyName()
            };

            // Create nock scope
            const scope = nock(baseUrl)
              .post(/^\/messages/, {
                  messages: [
                      {
                          message: messageJson1
                      },
                      {
                          message: messageJson2
                      }
                  ]
              })
              .reply(200, {
                  request_id: faker.datatype.uuid()
              })

            // Build client
            let client = new FacebookMessengerClient({
                apiKey: token,
                baseUrl: baseUrl
            })

            // Get middleware
            let mw = client.middleware()

            // Call middleware
            mw({
                method: 'POST',
                body: {
                    "object": "page",
                    "entry": [
                        messageJson1,
                        messageJson2
                    ]
                }
            }, null, () => {})

            setTimeout(() => {

                // Validate nock interactions
                scope.done()

                // Signal test done
                done()

            }, 100)
        })
    })
})
