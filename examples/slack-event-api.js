'use strict';
//server
const Hapi = require("hapi");
const Inert = require("inert");
//slack web client
const WebClient = require("@slack/client").WebClient;
const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN/*event-api-test bot token*/);
//slack event client if you are gonna user this
const slackEvents = require('@slack/events-api')
    .createSlackEventAdapter(CONFIG.slack.verificationToken, {"includeBody" : true}/*this property should be there*/);

const Botanalytics = new require("botanalytics").SlackEventApi(CONFIG.redis.slack.key,CONFIG.slack.eventapi, {debug : false, baseUrl:"http://localhost:8080/v1"});


//handle slack events
const slackEventHandler = function(request, h){
    //Log incoming request
    Botanalytics.log(request.payload);
    //handle challenge event to establish
    if (request.payload.challenge)
        return request.payload.challenge;

    //Ignore other bots's messages if necessary
    if(request.payload.event.subtype && request.payload.event.subtype === 'bot_message')
        return null;

    else{//Handle event
        //lets say we return file if we find file word in event.text
        if(request.payload.event.text.indexOf("file") >=0){

            slackClient.files.upload("image.png", {
                channels : request.payload.event.channel,
                file: fs.createReadStream("obsolute/path/to/file"),
                fileType : "auto"

            }, function(a,b){
                if (a)
                    console.log("ERR", a);
                else
                    console.log("File upload success!");
            });
        }
        //send attachment
        else if(request.payload.event.text.indexOf("attachment")>=0){
            slackClient.chat.postMessage(request.payload.event.channel, "Your attachment",{
                "attachments": [
                    {
                        "fallback": "Required plain-text summary of the attachment.",
                        "color": "#36a64f",
                        "pretext": "Optional text that appears above the attachment block",
                        "author_name": "Bobby Tables",
                        "author_link": "http://flickr.com/bobby/",
                        "author_icon": "http://flickr.com/icons/bobby.jpg",
                        "title": "Slack API Documentation",
                        "title_link": "https://api.slack.com/",
                        "text": "Optional text that appears within the attachment",
                        "fields": [
                            {
                                "title": "Priority",
                                "value": "High",
                                "short": false
                            }
                        ],
                        "image_url": "http://my-website.com/path/to/image.jpg",
                        "thumb_url": "http://example.com/path/to/thumb.png",
                        "footer": "Slack API",
                        "footer_icon": "https://platform.slack-edge.com/img/default_application_icon.png",
                        "ts": 123456789
                    }
                ]

            }).catch(console.error).then(res => {});
            //send menu component
        }else if (request.payload.event.text.indexOf("menu")>= 0) {
            slackClient.chat.postMessage(request.payload.event.channel, "Your menu",
                {
                    "text": "Would you like to play a game?",
                    "response_type": "in_channel",
                    "attachments": [
                        {
                            "text": "Choose a game to play",
                            "fallback": "If you could read this message, you'd be choosing something fun to do right now.",
                            "color": "#3AA3E3",
                            "attachment_type": "default",
                            "callback_id": "game_selection",
                            "actions": [
                                {
                                    "name": "games_list",
                                    "text": "Pick a game...",
                                    "type": "select",
                                    "options": [
                                        {
                                            "text": "Hearts",
                                            "value": "hearts"
                                        },
                                        {
                                            "text": "Bridge",
                                            "value": "bridge"
                                        },
                                        {
                                            "text": "Checkers",
                                            "value": "checkers"
                                        },
                                        {
                                            "text": "Chess",
                                            "value": "chess"
                                        },
                                        {
                                            "text": "Poker",
                                            "value": "poker"
                                        },
                                        {
                                            "text": "Falken's Maze",
                                            "value": "maze"
                                        },
                                        {
                                            "text": "Global Thermonuclear War",
                                            "value": "war"
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }).catch(console.err).then(resp => {});
        }
        else//send simple greeting message
            slackClient.chat.postMessage(request.payload.event.channel, "Hello there")
                .then((response) => {})
                .catch(console.error);
    }
        return null;
};

//server
const server = new Hapi.Server({port : port});

const runServer = async () => {

    await server.register(Inert);

    server.route({
        method : 'POST',
        path : '/slack/events',
        handler : slackEventHandler
    });

    server.route({
        method: 'POST',
        path : '/slack/interactive',
        handler : function (request, h) {
            //handle interactive messages
            console.log(request.payload.payload);
            const interactiveMessage = JSON.parse(request.payload.payload);
            //do stuff with the data
            // .......
            //log data
            Botanalytics.log(JSON.parse(request.payload.payload));
            return null;
        }
    });

    server.route({
        method: 'GET',
        path: '/{param*}',
        handler: {
            directory: {
                path: '.',
                redirectToSlash: true,
                index: true,
            }
        }
    });

    await server.start();

    console.log('Server running at:', server.info.uri);
};
//run server
runServer();

