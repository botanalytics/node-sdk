import nock from 'nock'
import sinon from 'sinon/pkg/sinon-esm.js';
import {faker} from '@faker-js/faker'

import {MicrosoftBotFrameworkClient} from '../src/index.js'

const baseUrl = 'https://api.botanalytics.co'
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJjaGFubmVsIjoibWljcm9zb2Z0LWJvdC1mcmFtZXdvcmsifQ.d_QTtDM032aYaviYSjad4RV79UCWFRo9rtHc_kAzJUg'

describe('MicrosoftBotFrameworkClient', function () {

    describe('middleware', function () {

        it('should log activity and add other hooks', function (done) {

            // Set timeout
            this.timeout(200)

            // Create messages
            let messageJson = {
                id: faker.datatype.uuid(),
                name: faker.company.companyName()
            };

            // Create nock scope
            const scope = nock(baseUrl)
              .post(/^\/messages/, body => {

                  let first = body.messages.shift().message;

                  return first.timestamp > 0 && first.activity.id === messageJson.id && first.activity.name === messageJson.name;

              })
              .reply(200, {
                  request_id: faker.datatype.uuid()
              })

            // Build client
            let mw = new MicrosoftBotFrameworkClient({
                apiKey: token,
                baseUrl: baseUrl
            }).middleware()

            // Create context
            let context = {
                activity: messageJson,
                onSendActivities: function () {
                },
                onUpdateActivity: function () {
                },
                onDeleteActivity: function () {
                }
            };

            // Mock context
            let contextMock = sinon.mock(context);

            // Configure mock expectations
            contextMock.expects('onSendActivities').once();
            contextMock.expects('onUpdateActivity').once();
            contextMock.expects('onDeleteActivity').once();

            // Send context
            mw.onTurn(context, async () => {
            });

            // Verify mock
            contextMock.verify()

            setTimeout(() => {

                // Validate nock interactions
                scope.done()

                // Signal test done
                done()

            }, 100)
        })

        it('should log send activities', function (done) {

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
              .post(/^\/messages/, body => {

                  if (body.messages.length < 2)
                      return false;

                  let first = body.messages[0].message;
                  let second = body.messages[1].message;

                  return first.timestamp > 0 && first.activity.id === messageJson1.id && first.activity.name === messageJson1.name
                    && second.timestamp > 0 && second.activity.id === messageJson2.id && second.activity.name === messageJson2.name;

              })
              .reply(200, {
                  request_id: faker.datatype.uuid()
              })

            // Build client
            let mw = new MicrosoftBotFrameworkClient({
                apiKey: token,
                baseUrl: baseUrl
            }).middleware()

            // Create context
            let context = {
                activity: {},
                onSendActivities: function () {
                },
                onUpdateActivity: function () {
                },
                onDeleteActivity: function () {
                }
            };

            // Spy on onSendActivities method
            sinon.spy(context, 'onSendActivities')

            // Send context
            mw.onTurn(context, async () => {
            })

            // Get passed handler
            let handler = context.onSendActivities.getCall(0).args[0]

            // Pass activities
            handler(context, [messageJson1, messageJson2], async () => {
            });

            setTimeout(() => {

                // Validate nock interactions
                scope.done()

                // Signal test done
                done()

            }, 100)
        })

        it('should log update activity', function (done) {

            // Set timeout
            this.timeout(200)

            // Create messages
            let messageJson = {
                id: faker.datatype.uuid(),
                name: faker.company.companyName()
            };

            // Create nock scope
            const scope = nock(baseUrl)
              .post(/^\/messages/, body => {

                  let first = body.messages[0].message;

                  if (!Object.keys(first.activity).length)
                      return false;

                  return first.timestamp > 0 && first.activity.id === messageJson.id && first.activity.name === messageJson.name && first.activity.type === 'messageUpdate';

              })
              .reply(200, {
                  request_id: faker.datatype.uuid()
              })

            // Build client
            let mw = new MicrosoftBotFrameworkClient({
                apiKey: token,
                baseUrl: baseUrl
            }).middleware()

            // Create context
            let context = {
                activity: {},
                onSendActivities: function () {
                },
                onUpdateActivity: function () {
                },
                onDeleteActivity: function () {
                }
            };

            // Spy on onUpdateActivity method
            sinon.spy(context, 'onUpdateActivity')

            // Send context
            mw.onTurn(context, async () => {
            })

            // Get passed handler
            let handler = context.onUpdateActivity.getCall(0).args[0]

            // Pass activities
            handler(context, messageJson, async () => {
            });

            setTimeout(() => {

                // Validate nock interactions
                scope.done()

                // Signal test done
                done()

            }, 100)
        })

        it('should log delete activity', function (done) {

            // Set timeout
            this.timeout(200)

            // Create messages
            let messageJson = {
                id: faker.datatype.uuid(),
                name: faker.company.companyName()
            };

            // Create nock scope
            const scope = nock(baseUrl)
              .post(/^\/messages/, body => {

                  let first = body.messages[0].message;

                  if (!Object.keys(first.activity).length)
                      return false;

                  console.log(first)

                  return first.timestamp > 0 && first.activity.id === messageJson.id && first.activity.name === messageJson.name && first.activity.type === 'messageDelete';

              })
              .reply(200, {
                  request_id: faker.datatype.uuid()
              })

            // Build client
            let mw = new MicrosoftBotFrameworkClient({
                apiKey: token,
                baseUrl: baseUrl
            }).middleware()

            // Create context
            let context = {
                activity: {},
                onSendActivities: function () {
                },
                onUpdateActivity: function () {
                },
                onDeleteActivity: function () {
                },
                applyConversationReference: function () {
                }
            };

            // Spy on onUpdateActivity method
            sinon.spy(context, 'onDeleteActivity')

            // Create conversatoion reference object
            let conversationRef = {
                activityId: faker.datatype.uuid()
            }

            // Stub applyConversationReference method
            sinon.stub(context, 'applyConversationReference').withArgs({
                  type: 'messageDelete',
                  id: conversationRef.activityId
              },
              conversationRef,
              false
            ).returns({
                type: 'messageDelete',
                id: conversationRef.activityId,
                ...messageJson
            });

            // Send context
            mw.onTurn(context, async () => {})

            // Get passed handler
            let handler = context.onDeleteActivity.getCall(0).args[0]

            // Pass activities
            handler(context, conversationRef, async () => {});

            setTimeout(() => {

                // Validate nock interactions
                scope.done()

                // Signal test done
                done()

            }, 100)
        })
    })
})
