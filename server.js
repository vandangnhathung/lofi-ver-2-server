require('dotenv').config();
const express = require('express');
const cors = require('cors');
const SpotifyWebApi = require('spotify-web-api-node');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI
});

app.get('/login', (req, res) => {
    const scopes = ['streaming', 'user-read-private', 'user-read-email', 'user-modify-playback-state', 'user-read-playback-state'];
    const authorizeURL = spotifyApi.createAuthorizeURL(scopes);
    res.redirect(authorizeURL);
});

app.get('/callback', async (req, res) => {
    const { code } = req.query;
    try {
        const data = await spotifyApi.authorizationCodeGrant(code);
        const { access_token, refresh_token } = data.body;
        spotifyApi.setAccessToken(access_token);
        spotifyApi.setRefreshToken(refresh_token);
        // Redirect to your frontend with the tokens
        res.redirect(`${process.env.FRONTEND_URL}?access_token=${access_token}&refresh_token=${refresh_token}`);
    } catch (error) {
        console.error('Error getting tokens:', error);
        res.status(500).send('Authentication failed');
    }
});

app.get('/refresh_token', async (req, res) => {
    const { refresh_token } = req.query;
    spotifyApi.setRefreshToken(refresh_token);
    try {
        const data = await spotifyApi.refreshAccessToken();
        const access_token = data.body['access_token'];
        res.json({ access_token });
    } catch (error) {
        console.error('Error refreshing access token:', error);
        res.status(500).send('Could not refresh access token');
    }
});

app.get('/search', async (req, res) => {
    const { q } = req.query;
    try {
        const data = await spotifyApi.searchTracks(q);
        res.json(data.body);
    } catch (error) {
        console.error('Error searching tracks:', error);
        res.status(500).json({ error: 'Failed to search tracks' });
    }
});

// For local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3002;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app;