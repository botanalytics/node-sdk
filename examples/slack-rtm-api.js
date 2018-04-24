'use strict';

const {RtmClient, CLIENT_EVENTS, RTM_EVENTS} = require("@slack/client");
const rtm = new RtmClient(CONFIG.slack.eventapi/*event-api-test bot token*/, {
    dataStore:false,
    useRtmConnect: true
});
const Botanalytics = require("botanalytics").SlackRTMApi(process.env.BOTANALYTICS_TOKEN, {debug :true});
//!!!!!!!!!ATTACH BOTANALYTICS!!!!!!!!!!
Botanalytics.attach(rtm, console.error);

rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, (connectData) => {

    console.log(`Logged in as ${connectData.self.id} of team ${connectData.team.id}`);
});

rtm.on(RTM_EVENTS.MESSAGE, (message) => {

    //console.log(JSON.stringify(message));
    rtm.sendTyping(message.channel);
    rtm.sendMessage('Hello There', message.channel);
});
console.log("Event subscriptions end.......");
// The client will emit an RTM.RTM_CONNECTION_OPENED event when connection is ready for
// sending and receiving messages
rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, () => {
    console.log("Connected to slack RTM api...");
});

// Start RTM
rtm.start();