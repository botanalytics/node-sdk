const MicrosoftBotFramework = require('./platforms/microsoft');
const FacebookMessenger = require('./platforms/facebook');
const GoogleAssistant = require('./platforms/google');
const AmazonAlexa = require('./platforms/amazon.alexa');
const AmazonLex = require('./platforms/amazon.lex');
const Viber = require('./platforms/viber');
const Kik = require('./platforms/kik');
const SlackEventApi = require('./platforms/slack.event.api');
const SlackRTMApi = require('./platforms/slack.rtm.api');
module.exports.MicrosoftBotFramework = MicrosoftBotFramework;
module.exports.FacebookMessenger = FacebookMessenger;
module.exports.GoogleAssistant = GoogleAssistant;
module.exports.AmazonAlexa = AmazonAlexa;
module.exports.AmazonLex = AmazonLex;
module.exports.Viber = Viber;
module.exports.Kik = Kik;
module.exports.SlackEventApi = SlackEventApi;
module.exports.SlackRTMApi = SlackRTMApi;

