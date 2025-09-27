export const handler = async (event) => {
  // Ensure the request is a POST request
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // 1. Get the 'contents' array directly from the request body
    const { contents } = JSON.parse(event.body);

    // 2. Securely get the Gemini API key from Netlify's environment variables
    const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Gemini API key is not configured.' }) };
    }

    // 3. Determine the correct model based on whether image data is present
        const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;

    // 4. Make the direct call to the Google Gemini API
    const geminiResponse = await fetch(apiURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }) // Forward the 'contents' array
    });
    
    // 5. Get the raw response data from Gemini
    const responseData = await geminiResponse.json();

    // If Google's API returned an error, forward that error
    if (!geminiResponse.ok) {
      return {
        statusCode: geminiResponse.status,
        body: JSON.stringify(responseData)
      };
    }
    
    // 6. Return the successful, unmodified Gemini API response to the frontend
    return {
      statusCode: 200,
      body: JSON.stringify(responseData)
    };

  } catch (error) {
    // Catch any other errors (like invalid JSON from the frontend)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
