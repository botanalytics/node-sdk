'use strict';

const BotKit = require('botkit');
const botanalyticsFacebook = require("localbotanalytics").BotkitMiddlewares.Facebook(process.env.BOTANALYTICS_TOKEN, {debug:true});

const facebookController = BotKit.facebookbot({
    access_token : process.env.FACEBOOK_PAGE_TOKEN,
    verify_token : process.env.FACEBOOK_VERIFY_TOKEN,
    debug : true
});
//spawn bot
const facebookBot = facebookController.spawn({});

facebookController.middleware.receive.use(botanalyticsFacebook.receive);
facebookController.middleware.send.use(botanalyticsFacebook.send);

facebookController.setupWebserver(8001, function (err, webserver) {

    facebookController.createWebhookEndpoints(facebookController.webserver, facebookBot, function () {

        console.log("Bot is online....");
    });
});



facebookController.on('facebook_optin', function (bot, message) {
    bot.reply(message, "Welcome to Test Bot");
});

facebookController.hears(['.*'], ['message_received'], function(bot, message) {

    console.log("______________________________________");
    console.log(JSON.stringify(message));
    console.log("Bot type '%s'", bot.type);
    console.log("______________________________________");

    bot.reply(message, "I love you Botanalytics");

});