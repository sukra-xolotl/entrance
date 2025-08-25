// This file should be placed at: /netlify/functions/call-gemini.js

// Using an ES module for async/await syntax
export async function handler(event) {
  // 1. Check for the correct request method
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405, // Method Not Allowed
      body: JSON.stringify({ error: 'Only POST requests are allowed.' }),
    };
  }

  // 2. Securely get the API key from Netlify's environment variables
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API key is not set on the server.' }),
    };
  }

  // 3. Get the prompt from the request body sent by the frontend
  let prompt;
  try {
    const body = JSON.parse(event.body);
    prompt = body.prompt;
    if (!prompt) {
      throw new Error('Prompt is missing from the request body.');
    }
  } catch (error) {
    return {
      statusCode: 400, // Bad Request
      body: JSON.stringify({ error: `Invalid request body: ${error.message}` }),
    };
  }
  
  // 4. Prepare the request to the actual Google Gemini API
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
  
  const requestBody = {
    contents: [{
      parts: [{ text: prompt }]
    }]
  };

  // 5. Make the API call from the serverless function
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Google API Error: ${errorText}`);
        return {
            statusCode: response.status,
            body: JSON.stringify({ error: `Failed to fetch from Google API. Status: ${response.status}` }),
        };
    }

    const data = await response.json();
    
    // 6. Send the successful response back to your frontend
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };

  } catch (error) {
    console.error('Error calling Google API:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `An internal error occurred: ${error.message}` }),
    };
  }
}
