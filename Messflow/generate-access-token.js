#!/usr/bin/env node

/**
 * Google Drive Access Token Generator
 * 
 * This script helps generate a long-lived access token for Google Drive API
 * that can be used in the Edge Function for immediate testing.
 * 
 * Usage: node generate-access-token.js
 */

const { google } = require('googleapis');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Configuration
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const TOKEN_PATH = 'google-drive-token.json';

// OAuth 2.0 Client configuration
// You need to create this in Google Cloud Console
const CLIENT_CONFIG = {
  client_id: process.env.GDRIVE_CLIENT_ID,
  client_secret: process.env.GDRIVE_CLIENT_SECRET,
  redirect_uris: ['http://localhost:3000/callback']
};

if (!CLIENT_CONFIG.client_id || !CLIENT_CONFIG.client_secret) {
  console.log('❌ Missing OAuth credentials');
  console.log('Please set GDRIVE_CLIENT_ID and GDRIVE_CLIENT_SECRET environment variables');
  console.log('Or create them in Google Cloud Console:');
  console.log('1. Go to https://console.cloud.google.com/');
  console.log('2. Create a new project or select existing');
  console.log('3. Go to APIs & Services → Credentials');
  console.log('4. Create OAuth 2.0 Client ID (Web application)');
  console.log('5. Set redirect URI to: http://localhost:3000/callback');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function getOAuth2Client() {
  const { client_id, client_secret, redirect_uris } = CLIENT_CONFIG;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );
  return oAuth2Client;
}

function getAccessToken() {
  const oAuth2Client = getOAuth2Client();

  // Generate authorization URL
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('🔑 Google Drive Access Token Generator');
  console.log('=====================================');
  console.log('');
  console.log('1. Open this URL in your browser:');
  console.log(authUrl);
  console.log('');
  console.log('2. Sign in and authorize the application');
  console.log('3. Copy the authorization code from the callback URL');
  console.log('');
  
  rl.question('Enter the authorization code: ', (code) => {
    rl.close();
    
    oAuth2Client.getToken(code, (err, token) => {
      if (err) {
        console.error('❌ Error retrieving access token:', err);
        process.exit(1);
      }

      // Save token to file
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));
      
      console.log('');
      console.log('✅ Access token saved to:', TOKEN_PATH);
      console.log('');
      console.log('📋 Copy this token to your Supabase environment variables:');
      console.log('GDRIVE_ACCESS_TOKEN=' + token.access_token);
      console.log('');
      console.log('⚠️  Note: This token will expire in 1 hour.');
      console.log('   For production, implement token refresh logic.');
      console.log('');
      console.log('🚀 Next steps:');
      console.log('1. Set the environment variable in Supabase Dashboard');
      console.log('2. Redeploy the Edge Function');
      console.log('3. Test the upload functionality');
    });
  });
}

// Check if token file exists
if (fs.existsSync(TOKEN_PATH)) {
  console.log('ℹ️  Token file already exists:', TOKEN_PATH);
  console.log('   Delete it if you want to generate a new token');
  console.log('');
  
  rl.question('Do you want to generate a new token? (y/N): ', (answer) => {
    rl.close();
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      getAccessToken();
    } else {
      console.log('✅ Exiting...');
      process.exit(0);
    }
  });
} else {
  getAccessToken();
}