'use strict';
 /**
  * This sample demonstrates an implementation of the Lex Code Hook Interface
  * in order to serve a sample bot which manages orders for flowers.
  * Bot, Intent, and Slot models which are compatible with this sample can be found in the Lex Console
  * as part of the 'OrderFlowers' template.
  *
  * For instructions on how to set up and test this bot, as well as additional samples,
  *  visit the Lex Getting Started documentation.
  */


// --------------- Helpers to build responses which match the structure of the necessary dialog actions -----------------------
function elicitSlot(sessionAttributes, intentName, slots, slotToElicit, message, responseCard) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'ElicitSlot',
            intentName,
            slots,
            slotToElicit,
            message,
            responseCard,
        },
    };
}
function close(sessionAttributes, fulfillmentState, message, responseCard) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Close',
            fulfillmentState,
            message,
            responseCard,
        },
    };
}


function delegate(sessionAttributes, slots) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Delegate',
            slots,
        },
    };
}

function buildValidationResult(isValid, violatedSlot, messageContent) {
    return {
        isValid,
        violatedSlot,
        message: { contentType: 'PlainText', content: messageContent },
    };
}

function validatePhoneNumber(intentRequest, callback) {
    console.log('Inside validatePhoneNumber');
    const source = intentRequest.invocationSource;
	const outputSessionAttributes = intentRequest.sessionAttributes || {};

   if (source === 'DialogCodeHook') {
        console.log( ' Inside Code Hook ');
		const slots = intentRequest.currentIntent.slots;
		console.log('Intent Name : ' + intentRequest.currentIntent.name );
		
		console.log(' Intent Request '+ JSON.stringify(intentRequest));
		var inputNumber = '';
		
		
		if( slots.CallBackNumber != null 
			&& ( 
				typeof(outputSessionAttributes.CallbackPhoneNumber) === 'undefined'
				|| (
					typeof(outputSessionAttributes.CallbackPhoneNumber) !== 'undefined'
					&& outputSessionAttributes.CallbackPhoneNumber == 'InValid'
					)
				)			
		) {
			// Callback number validation
			inputNumber = slots.CallBackNumber;
			
			 if( inputNumber.length == 10) {
				inputNumber = '+1'+inputNumber;
				outputSessionAttributes.CallbackPhoneNumber = inputNumber;
				console.log(' Output '+JSON.stringify(outputSessionAttributes));
				callback( elicitSlot( outputSessionAttributes, intentRequest.currentIntent.name,
				slots, 'NumberConfirmation', { contentType: 'SSML', content: '<speak> Okay, we will call you back at <say-as interpret-as="telephone">'+slots.CallBackNumber+'</say-as>.  is that correct? </speak>'}, null ) );
				return; 
			} else {
				if(typeof(outputSessionAttributes.RetryCounter) !== 'undefined') {
				   outputSessionAttributes.RetryCounter = parseInt(outputSessionAttributes.RetryCounter) + 1;
				}else {
					outputSessionAttributes.RetryCounter = 1;
				}
				if(outputSessionAttributes.RetryCounter === 2){
					outputSessionAttributes.CallbackPhoneNumber = 'InValid';
					callback(close(outputSessionAttributes, 'Failed',
						{ contentType: 'PlainText', content: 'Sorry, we are having trouble understanding you.'}));
					return;
				}
				callback( elicitSlot( outputSessionAttributes, intentRequest.currentIntent.name,
				slots, 'CallBackNumber', { contentType: 'PlainText', content: 'The phone number you entered is invalid. Please provide the number you would like us to call you back on'}, null ) );
				return;
			}
			
			
		} else if( 
			typeof(outputSessionAttributes.CallbackPhoneNumber) !== 'undefined' 
			&& outputSessionAttributes.CallbackPhoneNumber != 'InValid' 
			&& slots.NumberConfirmation != null  
		) {
			// Yes No Confirmation
			console.log("inside yesNo slot");

			var yesNo = slots.NumberConfirmation;
			if(yesNo.toLowerCase() == "no" || yesNo.toLowerCase() == "nope" || yesNo.toLowerCase() == "cancel") {
				console.log("inside NO");
				outputSessionAttributes.CallbackPhoneNumber = 'InValid';
				if(typeof(outputSessionAttributes.RetryCounter) !== 'undefined') {
				   outputSessionAttributes.RetryCounter = parseInt(outputSessionAttributes.RetryCounter) + 1;
				}else {
					outputSessionAttributes.RetryCounter = 1;
				}
				if( outputSessionAttributes.RetryCounter > 1 ){
					callback(close(outputSessionAttributes, 'Failed',
						{ contentType: 'PlainText', content: 'Sorry, we are having trouble understanding you.'}));
					return;
				}
				callback( elicitSlot( outputSessionAttributes, intentRequest.currentIntent.name,
				slots, 'CallBackNumber', { contentType: 'PlainText', content: 'Okay. Kindly specify phone number again.'}, null ) );
				return;
			} else {
				callback(close(outputSessionAttributes, 'Fulfilled',
				{ contentType: 'PlainText', content: 'Okay'}));
				return;
			}
		} else {
			// Retry
			if(typeof(outputSessionAttributes.RetryCounter) !== 'undefined') {
			   outputSessionAttributes.RetryCounter = parseInt(outputSessionAttributes.RetryCounter) + 1;
			}else {
				outputSessionAttributes.RetryCounter = 1;
			}
			if(outputSessionAttributes.RetryCounter > 1 ){
				outputSessionAttributes.CallbackPhoneNumber = 'InValid';
				callback(close(outputSessionAttributes, 'Failed',
					{ contentType: 'PlainText', content: 'Sorry, we are having trouble understanding you.'}));
				return;
			}
			callback( elicitSlot( outputSessionAttributes, intentRequest.currentIntent.name,
				slots, 'CallBackNumber', { contentType: 'PlainText', content: 'Okay. Kindly specify phone number again.'}, null ) );
			return;
		}
   }
   console.log( 'Outside code hook ');
}

 // --------------- Intents -----------------------

/**
 * Called when the user specifies an intent for this skill.
 */
function dispatch(intentRequest, callback) {
    console.log(`dispatch userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.name}`);
    return validatePhoneNumber(intentRequest, callback);
}

// --------------- Main handler -----------------------

// Route the incoming request based on intent.
// The JSON body of the request is provided in the event slot.
exports.handler = (event, context, callback) => {
    try {    
        console.log(`event.bot.name=${event.bot.name}`);
        // Print Event JSON passed from ContactFlow/Event
    	var passedEventData = JSON.stringify(event);
    	console.log( ' EventData : '+passedEventData);
        dispatch(event, (response) => callback(null, response));
    } catch (err) {
        callback(err);
    }
};
