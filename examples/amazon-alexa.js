'use strict';
const Alexa = require('ask-sdk');

// TODO replace with your app ID (OPTIONAL).
const APP_ID = process.env.SKILL_ID;
const Botanalytics = require('botanalytics').AmazonAlexa(process.env.BOTANALYTICS_TOKEN, {
    debug: true
});

const LaunchRequestHandler = {
    canHandle(handlerInput){
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput){
        return handlerInput
            .responseBuilder
            .speak('Welcome to botanalytics Alexa Skills Kit sample. Please tell me your favorite color by saying, my favorite color is red.')
            .reprompt('Please tell me your favorite color by saying, my favorite color is red')
            .getResponse();
    }

};
const SessionEndedRequestHandler = {
    canHandle(handlerInput){
        return  handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput){
        return handlerInput
            .responseBuilder
            .speak("Our entertainment ends here!")
            .withShouldEndSession(true)
            .getResponse();
    }
};
const MyColorIsIntentHandler = {
    canHandle(handlerInput){
        return handlerInput.requestEnvelope.request.type === "IntentRequest"
            && handlerInput.requestEnvelope.request.intent.name === "MyColorIsIntent";
    },
    handle(handlerInput){
        const favoriteColorSlot = handlerInput.requestEnvelope.request.intent.slots.Color;
        if(favoriteColorSlot){
            //Get value
            const favoriteColor = favoriteColorSlot.value;
            //Get session attributes
            const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
            sessionAttributes['favoriteColor'] = favoriteColor;
            //save session attributes
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
            return handlerInput
                .responseBuilder
                .speak(`I now know your favorite color is ${favoriteColor}. You can ask me ` +
                    "your favorite color by saying, what's my favorite color?")
                .reprompt("You can ask me your favorite color by saying, what's my favorite color?")
                .getResponse();
        }else {
            return handlerInput
                .responseBuilder
                .speak("I'm not sure what your favorite color is. Please try again.")
                .reprompt("I'm not sure what your favorite color is. You can tell me your " +
                    'favorite color by saying, my favorite color is red')
                .getResponse();
        }
    }
};
const WhatsMyColorIntentHandler = {
    canHandle(handlerInput){
        return handlerInput.requestEnvelope.request.type === "IntentRequest"
            && handlerInput.requestEnvelope.request.intent.name === "WhatsMyColorIntent";
    },
    handle(handlerInput){
        //get color from session if exists
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const color = sessionAttributes['favoriteColor'];
        if(color){
            return handlerInput.responseBuilder
                .speak(`Your favorite color is ${color}. Goodbye.`)
                .withShouldEndSession(true)
                .getResponse();
        }else{
            return handlerInput.responseBuilder
                .speak("I'm not sure what your favorite color is, you can say, my favorite color is red.")
                .getResponse();
        }
    }
};
const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak('Welcome to botanalytics the Alexa Skills Kit sample Please tell me your favorite color by saying, my favorite color is red.')
            .reprompt('Welcome to botanalytics the Alexa Skills Kit sample Please tell me your favorite color by saying, my favorite color is red.')
            .getResponse();
    }
};
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
                || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {

        return handlerInput.responseBuilder
            .speak('Goodbye!')
            .withSimpleCard('Goodbye!', 'Hope to see you again.')
            .getResponse();
    }
};
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`Error handled: ${error.message}`);

        return handlerInput.responseBuilder
            .speak('Sorry, I can\'t understand the command. Please say again.')
            .reprompt('Sorry, I can\'t understand the command. Please say again.')
            .getResponse();
    },
};

const skill = Alexa.SkillBuilders.custom()
    .withSkillId(APP_ID)
    .addRequestHandlers(
        LaunchRequestHandler,
        MyColorIsIntentHandler,
        WhatsMyColorIntentHandler,
        HelpIntentHandler,
        SessionEndedRequestHandler,
        CancelAndStopIntentHandler
    )
    .addErrorHandlers(ErrorHandler)
    .create();
//skill as lambda handler function
const lambda = Alexa.SkillBuilders.custom()
    .withSkillId(APP_ID)
    .addRequestHandlers(
        LaunchRequestHandler,
        MyColorIsIntentHandler,
        WhatsMyColorIntentHandler,
        HelpIntentHandler,
        SessionEndedRequestHandler,
        CancelAndStopIntentHandler
    )
    .addErrorHandlers(ErrorHandler)
    .lambda();
//Lambda handler function wrapper example
exports.handler = Botanalytics.handler(lambda);
//request handler wrapper example
exports.handler = Botanalytics.handler(function(event, context) {
    return skill.invoke(event, context);
});

