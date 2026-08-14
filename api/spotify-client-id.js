export default function handler(req, res) {
  res.status(200).json({ 
    clientId: process.env.SPOTIFY_CLIENT_ID,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI || "https://cotoo.dev"
  });
}
