// Imports
import BaseClient from './base.js';

// Constants
const channelId = 'microsoft-bot-framework';

// Microsoft Bot Framework channel client
export default class MicrosoftBotFrameworkClient extends BaseClient {

    constructor(options) {

        super(Object.assign({
            _channel: channelId
        }, options))
    }

    middleware() {

        // Variable for referencing this
        const that = this;

        // Return middleware object
        return {

            // onTurn function
            async onTurn(context, next) {

                // Check for activity
                if (context && context.activity) {

                    // Get a copy of activity
                    let activity = Object.assign({}, context.activity)

                    // Send data by adding fallback timestamp
                    that._sendMessages({
                        timestamp: Date.now(),
                        activity
                    })

                    // Hook up on onSend pipeline
                    context.onSendActivities(async (context, activities, next) => {

                        // Run rest of the pipeline
                        const responses = await next();

                        // Iterate over the activities
                        if (activities && activities.length) {

                            // Process activities
                            let activitiesToSend = activities.map((sendActivity, index) => {

                                // Get a copy of activity
                                let sendActivityCopy = Object.assign({}, sendActivity)

                                // Use response ID if available
                                sendActivityCopy.id = responses && responses[index] ? responses[index].id : sendActivityCopy.id;

                                // Return the copy
                                return {
                                    activity: sendActivityCopy,
                                    timestamp: Date.now()
                                }
                            })

                            // Send all activities at once
                            that._sendMessages(...activitiesToSend)
                        }
                    })

                    // Hook up on onUpdate pipeline
                    context.onUpdateActivity(async (context, updateActivity, next) => {

                        // Run rest of the pipeline
                        const response = await next();

                        // Sanity check for activity
                        if (updateActivity) {

                            // Get a copy of activity
                            let updateActivityCopy = Object.assign({
                                type: 'messageUpdate'
                            }, updateActivity);

                            // Send activity
                            that._sendMessages({
                                activity: updateActivityCopy,
                                timestamp: Date.now()
                            })
                        }

                        // Return response
                        return response
                    })

                    // Hook up on onDelete pipeline
                    context.onDeleteActivity(async (context, conversationRef, next) => {

                        // Run rest of the pipeline
                        await next();

                        // Sanity check for conversation ref
                        if (conversationRef) {

                            // Construct activity
                            let deleteActivity = context.applyConversationReference(
                              {
                                  type: 'messageDelete',
                                  id: conversationRef.activityId
                              },
                              conversationRef,
                              false
                            )

                            // Send activity
                            that._sendMessages({
                                activity: deleteActivity,
                                timestamp: Date.now()
                            })
                        }
                    })
                }

                // Continue further execution
                await next();
            }
        }
    }
}
