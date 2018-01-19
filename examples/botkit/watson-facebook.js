'use strict';

const BotKit = require('botkit');
const BotAnalyticsWatson = require("localbotanalytics").BotkitMiddlewares.Watson(process.env.BOTANALYTICS_TOKEN, {debug:false});

const facebookController = BotKit.facebookbot({
    access_token : process.env.FACEBOOK_PAGE_TOKEN,
    verify_token : process.env.FACEBOOK_VERIFY_TOKEN,
    debug : true
});
//spawn bot
const facebookBot = facebookController.spawn({});
//create watson middleware
const watsonMiddleware = require('botkit-middleware-watson')({
    username :  process.env.WATSON_USERNAME,
    password : process.env.WATSON_PASSWORD,
    workspace_id : process.env.WATSON_WORKSPACE_ID,
    version_date: '2017-05-26',
    minimum_confidence: 0.50, // (Optional) Default is 0.75
});

facebookController.middleware.receive.use(watsonMiddleware.receive);
facebookController.middleware.receive.use(BotAnalyticsWatson.receive);
facebookController.middleware.send.use(BotAnalyticsWatson.send);

facebookController.setupWebserver(8001, function (err, webserver) {

    facebookController.createWebhookEndpoints(facebookController.webserver, facebookBot, function () {

        console.log("Bot is online, I guess...");
    });
});



/*facebookController.middleware.send.use(function (bot, message, next) {

    console.log("______________________________________");
    console.log(JSON.stringify(message));
    console.log("Bot type '%s'", bot.type);
    console.log("______________________________________");
    next();
});*/

facebookController.on('facebook_optin', function (bot, message) {
   bot.reply(message, "Welcome to no-sense era of human history. You can chat with me but I'm kind of dumb bc of reasons...");
});

facebookController.hears(['.*'], ['message_received'], function(bot, message) {

    console.log("______________________________________");
    console.log(JSON.stringify(message));
    console.log("Bot type '%s'", bot.type);
    console.log("______________________________________");

    if (message.watsonError) {

        bot.reply(message, "I'm sorry, but for technical reasons I can't respond to your message");
    } else {

        bot.reply(message, message.watsonData.output.text.join('\n')+"addition");
        //bot.reply(message, message.watsonData.output.text.join('\n'));
    }
});

