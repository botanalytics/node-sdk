// Initialize the middleware 
var Botanalytics = require('botanalytics').MicrosoftBotFramework(process.env.BOTANALYTICS_TOKEN, {
    debug: true
});
 
// Initialize the connector and the bot 
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
 
// Use the middleware 
bot.use(Botanalytics);