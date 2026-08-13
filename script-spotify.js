const readline = require('readline');
const fs = require('fs');

const REDIRECT_URI = 'https://cotoo.dev';

function getSpotifyCredentials() {
  try {
    const envFile = fs.readFileSync('.env', 'utf8');
    const clientId = envFile.match(/SPOTIFY_CLIENT_ID=(.*)/)[1].trim();
    const clientSecret = envFile.match(/SPOTIFY_CLIENT_SECRET=(.*)/)[1].trim();
    
    if (!clientId || !clientSecret) {
      throw new Error("Missing credentials in .env file.");
    }
    
    return { clientId, clientSecret };
  } catch (error) {
    console.error('[Error] Failed to initialize credentials:', error.message);
    process.exit(1);
  }
}

async function requestRefreshToken(clientId, clientSecret, code) {
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code.trim(),
        redirect_uri: REDIRECT_URI,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error_description || data.error || "Unknown Spotify API error");
    }
    
    return data;
  } catch (error) {
    console.error('[Error] Spotify API request failed:', error.message);
    process.exit(1);
  }
}

function promptAuthorization(clientId) {
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=user-read-currently-playing`;
  
  console.log('Spotify Authorization Required');
  console.log('------------------------------');
  console.log(`Please visit the following URL to authorize the application:\n${authUrl}\n`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Enter the authorization code from the callback URL: ', async (code) => {
    rl.close();
    
    if (!code) {
      console.error('[Error] No authorization code provided. Process aborted.');
      process.exit(1);
    }

    const { clientSecret } = getSpotifyCredentials();
    const tokenData = await requestRefreshToken(clientId, clientSecret, code);
    
    console.log('\n[Success] Authentication completed. Environment variables configured:');
    console.log('-----------------------------------------------------------------');
    console.log(`SPOTIFY_CLIENT_ID=${clientId}`);
    console.log(`SPOTIFY_CLIENT_SECRET=${clientSecret}`);
    console.log(`SPOTIFY_REFRESH_TOKEN=${tokenData.refresh_token}`);
    console.log('-----------------------------------------------------------------');
  });
}

function init() {
  const { clientId } = getSpotifyCredentials();
  promptAuthorization(clientId);
}

init();
