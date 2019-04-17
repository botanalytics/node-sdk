//Microsoft Bot Framework V4 integration

// Initialize the middleware 
const Botanalytics = require('botanalytics').MicrosoftBotFramework(process.env.BOTANALYTICS_TOKEN, {
	debug: true
});
 
// Initialize the adapter and the bot 
const adapter = new BotFrameworkAdapter({
    appId: endpointConfig.appId || process.env.microsoftAppID,
    appPassword: endpointConfig.appPassword || process.env.microsoftAppPassword
});

// Catch-all for errors.
adapter.onTurnError = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    console.error(`\n [onTurnError]: ${ error }`);
    // Send a message to the user
    await context.sendActivity(`Oops. Something went wrong!`);
};
 
// Use the middleware 
adapter.use(Botanalytics.middleware);
