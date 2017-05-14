// Copyright 2016, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

process.env.DEBUG = 'actions-on-google:*';
const Assistant = require('actions-on-google').ApiAiAssistant;

const GA = require('botanalytics').GoogleAssistant;
const Botanalytics = new GA(process.env.BOTANALYTICS_TOKEN);

const NAME_ACTION = 'make_name';
const COLOR_ARGUMENT = 'color';
const NUMBER_ARGUMENT = 'number';

// [START SillyNameMaker]
exports.sillyNameMaker = (req, res) => {
  const assistant = new Assistant({request: req, response: res});
  console.log('Request headers: ' + JSON.stringify(req.headers));
  console.log('Request body: ' + JSON.stringify(req.body));

  
  Botanalytics.attach(assistant);

  // Make a silly name
  function makeName (assistant) {
    let number = assistant.getArgument(NUMBER_ARGUMENT);
    let color = assistant.getArgument(COLOR_ARGUMENT);
    assistant.tell('Alright, your silly name is ' +
      color + ' ' + number +
      '! I hope you like it. See you next time.');
  }

  let actionMap = new Map();
  actionMap.set(NAME_ACTION, makeName);

  assistant.handleRequest(actionMap);
};
// [END SillyNameMaker]
