const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API endpoint to convert cookie to token
app.post('/api/convert', async (req, res) => {
    try {
        const { cookie, tokenType } = req.body;

        if (!cookie) {
            return res.status(400).json({
                success: false,
                error: 'Cookie is required'
            });
        }

        // Extract xs cookie value
        let xsValue = null;
        const cookieParts = cookie.split(';');
        
        for (const part of cookieParts) {
            const trimmed = part.trim();
            if (trimmed.startsWith('xs=')) {
                xsValue = trimmed.substring(3);
                break;
            }
        }

        if (!xsValue) {
            return res.status(400).json({
                success: false,
                error: 'Could not find xs cookie in the provided string'
            });
        }

        // Call the external API
        const apiUrl = `https://c2t.lara.rest/${xsValue}`;
        
        const response = await axios.get(apiUrl, {
            timeout: 10000
        });

        // Return the API response
        res.json({
            success: response.data.success,
            token: response.data.token,
            error: response.data.error,
            tokenType: tokenType
        });

    } catch (error) {
        console.error('API Error:', error.message);
        
        if (error.response) {
            // The API responded with an error status
            res.status(error.response.status).json({
                success: false,
                error: `API Error: ${error.response.status} - ${error.response.statusText}`
            });
        } else if (error.request) {
            // The request was made but no response was received
            res.status(500).json({
                success: false,
                error: 'Unable to connect to the token service. Please try again later.'
            });
        } else {
            // Something else happened
            res.status(500).json({
                success: false,
                error: 'Internal server error: ' + error.message
            });
        }
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'Cookie to Token Converter',
        timestamp: new Date().toISOString()
    });
});

// Serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});
