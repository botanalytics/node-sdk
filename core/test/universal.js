import * as assert from 'assert'
import nock from 'nock'
import { faker } from '@faker-js/faker'

import { UniversalClient } from '../index.js'

const baseUrl = 'https://api.botanalytics.co'
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqb2huLWRvZSIsIm5hbWUiOiJKb2huIERvZSIsImlhdCI6MTUxNjIzOTAyMiwiY2hhbm5lbCI6InVuaXZlcnNhbCJ9.Y5wDwFj2MagfkGEl-Y8RVqhYsFwVjeCUoPxc7bRbis0'

describe('UniversalClient', function() {

    it('should send provided single message as-is', async function () {

        // Create message
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
        let client = new UniversalClient({
            apiKey: token,
            baseUrl: baseUrl
        })

        // Send a message
        await client.logMessage(messageJson);

        // Validate nock interactions
        scope.done()
    });

    it('should send provided multiple messages as-is', async function () {

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
        let client = new UniversalClient({
            apiKey: token,
            baseUrl: baseUrl
        })

        // Send a message
        await client.logMessages(messageJson1, messageJson2);

        // Validate nock interactions
        scope.done()
    });
});
