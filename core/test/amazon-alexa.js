import * as assert from 'assert';
import nock from 'nock'
import {faker} from '@faker-js/faker'

import {AmazonAlexaClient} from '../src/index.js'

const baseUrl = 'https://api.botanalytics.co'
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJjaGFubmVsIjoiYW1hem9uLWFsZXhhIn0.k5YIziFDeg-NxNyRckGPw83CNuTRIpI57C1227Wkyk8'

describe('AmazonAlexaClient', function () {

    describe('requestInterceptor', function () {

        it('should ignore if handler input is missing request envelope', async function () {

            // Create nock scope
            const scope = nock(baseUrl)
              .post(/^\/messages/)
              .reply(200, {
                  request_id: faker.datatype.uuid()
              })

            // Build client
            let interceptor = new AmazonAlexaClient({
                apiKey: token,
                baseUrl: baseUrl
            }).requestInterceptor()

            // Send invalid payload to request interceptor
            await interceptor.process({});

            // Assert scope not called
            assert.ok(!scope.isDone())

            // Clean up
            nock.cleanAll()
        })

        it('should send request envelope', function (done) {

            // Set timeout
            this.timeout(200)

            // Create messages
            let messageJson = {
                id: faker.datatype.uuid(),
                name: faker.company.companyName()
            };

            // Create nock scope
            const scope = nock(baseUrl)
              .post(/^\/messages/, {
                  messages: [
                      {
                          message: messageJson
                      }
                  ]
              })
              .reply(200, {
                  request_id: faker.datatype.uuid()
              })

            // Build client
            let interceptor = new AmazonAlexaClient({
                apiKey: token,
                baseUrl: baseUrl
            }).requestInterceptor()

            // Send invalid payload to request interceptor
            interceptor.process({
                requestEnvelope: messageJson
            });

            setTimeout(() => {

                // Validate nock interactions
                scope.done()

                // Signal test done
                done()

            }, 100)
        })
    })

    describe('responseInterceptor', function () {

        it('should ignore if handler input is missing request envelope', async function () {

            // Create nock scope
            const scope = nock(baseUrl)
              .post(/^\/messages/)
              .reply(200, {
                  request_id: faker.datatype.uuid()
              })

            // Build client
            let interceptor = new AmazonAlexaClient({
                apiKey: token,
                baseUrl: baseUrl
            }).responseInterceptor()

            // Send invalid payload to request interceptor
            await interceptor.process({
                response: {}
            });

            // Assert scope not called
            assert.ok(!scope.isDone())

            // Clean up
            nock.cleanAll()
        })

        it('should ignore if handler input is missing response', async function () {

            // Create nock scope
            const scope = nock(baseUrl)
              .post(/^\/messages/)
              .reply(200, {
                  request_id: faker.datatype.uuid()
              })

            // Build client
            let interceptor = new AmazonAlexaClient({
                apiKey: token,
                baseUrl: baseUrl
            }).responseInterceptor()

            // Send invalid payload to request interceptor
            await interceptor.process({
                requestEnvelope: {}
            });

            // Assert scope not called
            assert.ok(!scope.isDone())

            // Clean up
            nock.cleanAll()
        })

        it('should send response by adding request and timestamp', function (done) {

            // Set timeout
            this.timeout(200)

            // Create messages
            let requestEnvelope = {
                id: faker.datatype.uuid(),
                name: faker.company.companyName()
            };
            let response = {
                id: faker.datatype.uuid(),
                name: faker.company.companyName()
            };

            // Create nock scope
            const scope = nock(baseUrl)
              .post(/^\/messages/, body => {

                  let first = body.messages.shift().message;

                  return first.request && first.timestamp && first.id === response.id && first.name === response.name;

              })
              .reply(200, {
                  request_id: faker.datatype.uuid()
              })

            // Build client
            let interceptor = new AmazonAlexaClient({
                apiKey: token,
                baseUrl: baseUrl
            }).responseInterceptor()

            // Send invalid payload to request interceptor
            interceptor.process({
                requestEnvelope
            }, response);

            setTimeout(() => {

                // Validate nock interactions
                scope.done()

                // Signal test done
                done()

            }, 100)
        })
    })
})
