const axios = require('axios');

let cachedToken = null;
let tokenFetchedAt = null;

const getValidNibssToken = async () => {
  const oneHourInMs = 60 * 60 * 1000;
  const now = Date.now();

  // Return cached token if it is still valid
  if (
    cachedToken &&
    tokenFetchedAt &&
    now - tokenFetchedAt < oneHourInMs
  ) {
    return cachedToken;
  }

  try {
    const response = await axios.post(
      `${process.env.NIBSS_BASE_URL}/api/auth/token`,
      {
        apiKey: process.env.NIBSS_API_KEY,
        apiSecret: process.env.NIBSS_API_SECRET,
      }
    );

    // Save the new token
    cachedToken = response.data.token;

    // Save when the token was obtained
    tokenFetchedAt = Date.now();

    return cachedToken;
  } catch (error) {
    console.error(
      'Failed to get NIBSS token:',
      error.response?.data || error.message
    );

    throw error;
  }
};

module.exports = getValidNibssToken;