'use strict';

let util = require('util');
let http = require('http');
let Bot  = require('@kikinteractive/kik');
let Botanalytics = require('botanalytics').Kik(process.env.BOTANALYTICS_TOKEN, {
   debug: true
});

// Configure the bot
let bot = new Bot({
  username:  process.env.KIK_USERNAME,
  apiKey: process.env.KIK_APIKEY,
  baseUrl: process.env.KIK_BASEURL
});

bot.updateBotConfiguration();

Botanalytics.attach(bot);

bot.onTextMessage((message) => {
  //var replies = ["Hey, ho!", "Let's go!"];
  //bot.send(replies, message.from, message.chatId);
  message.reply(message.body);
});

bot.onPictureMessage((message) => {
  bot.send(Bot.Message.picture('http://i.imgur.com/oalyVlU.jpg')
    .setAttributionName('Imgur')
    .setAttributionIcon('http://s.imgur.com/images/favicon-96x96.png'),
    message.from,
    message.chatId);  
});


// Set up your server and start listening
let server = http
    .createServer(bot.incoming())
    .listen(process.env.PORT || 8080);
