import http from 'http';
import config from 'config';
import secret from 'secret';
import console from 'console';

// Decide on the base URL
const baseUrl = config.get('botanalytics.baseUrl') || 'https://api.botanalytics.co';

// Construct target URL
const targetUrl = baseUrl.endsWith('/') ? baseUrl + 'messages' : baseUrl + '/messages';

export function logInput(action, input) {

  console.debug('Looking for Botanalytics API key...')

  // Check for action
  if (!action) {

        // Handle error
    handleError('Action argument is missing.');
  }

  // Check for input
  if (!input) {

        // Handle error
    handleError('Input argument is missing.');
  }

  // Get API key secret
  let apiKey = secret.get('botanalytics.apiKey');

  // Check for API key
  if (!apiKey) {

    // Handle error
    handleError('Botanalytics API key secret is missing.');
  }

  // Destructure input
  let {
    $vivContext,
    $deviceContext,
    ...inputs
  } = input;

  // Create a payload to send
  let payload = {
    timestamp: Date.now(),
    action,
    inputs,
    $vivContext,
    $deviceContext
  };

  console.debug('Sending data...')

  // Send data
  let response = http.postUrl(targetUrl, payload, {
    format: 'json',
    passAsJson: true,
    headers: {
      'Authorization': 'Bearer ' + apiKey
    },
    returnHeaders: true
  });

  // Check status
  if (response.status === 401) {

    // Handle error
    handleError('Botanalytics authentication failed.');

  } else if (response.status === 400) {

    // Handle error
    handleError('Botanalytics rejected the malformed payload.');
 
  } else if (response.status === 500) {

   // Handle error
    handleError('Botanalytics API failed to respond due to an internal.');
   }
}

export function logOutput(action, input, output) {

  console.debug('Looking for Botanalytics API key...')

  // Check for action
  if (!action) {

        // Handle error
    handleError('Action argument is missing.');
  }

  // Check for input
  if (!input) {

        // Handle error
    handleError('Input argument is missing.');
  }

  // Check for output
  if (!output) {

        // Handle error
    handleError('Output argument is missing.');
  }

  // Get API key secret
  let apiKey = secret.get('botanalytics.apiKey');

  // Check for API key
  if (!apiKey) {

    // Handle error
    handleError('Botanalytics API key secret is missing.');
  }

  // Destructure input
  let {
    $vivContext,
    $deviceContext,
    ...inputs
  } = input;

  // Create a payload to send
  let payload = {
    timestamp: Date.now(),
    action,
    output,
    $vivContext,
    $deviceContext
  };

  console.debug('Sending data...')

  // Send data
  let response = http.postUrl(targetUrl, payload, {
    format: 'json',
    passAsJson: true,
    headers: {
      'Authorization': 'Bearer ' + apiKey
    },
    returnHeaders: true
  });

  // Check status
  if (response.status === 401) {

    // Handle error
    handleError('Botanalytics authentication failed.');

  } else if (response.status === 400) {

    // Handle error
    handleError('Botanalytics rejected the malformed payload.');
 
  } else if (response.status === 500) {

   // Handle error
    handleError('Botanalytics API failed to respond due to an internal.');
   }

   // Return output
   return output;
}

function handleError(message) {

  // Check for fail-fast flag
  let failFast = config.get('botanalytics.failFast');

  // Log the error
  console.error(message);

  // Check if fail-fast flag is true
  if (failFast === 'true' || failFast === 'yes')
    // Throw an exception
    throw new Error(message);
}
