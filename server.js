const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Import analyzers
const wikipediaAnalyzer = require('./src/analyzers/wikipediaAnalyzer');
const courtDataAnalyzer = require('./src/analyzers/courtDataAnalyzer');
const genericAnalyzer = require('./src/analyzers/genericAnalyzer');

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Main API endpoint
app.post('/api/analyze', async (req, res) => {
    try {
        const { question } = req.body;
        
        if (!question || typeof question !== 'string') {
            return res.status(400).json({ 
                error: 'Question is required and must be a string' 
            });
        }

        console.log('Processing question:', question);

        let result;
        const lowerQuestion = question.toLowerCase();

        // Route to appropriate analyzer
        if (lowerQuestion.includes('wikipedia') || lowerQuestion.includes('scrape')) {
            result = await wikipediaAnalyzer.analyze(question);
        } else if (lowerQuestion.includes('court') || lowerQuestion.includes('judgment')) {
            result = await courtDataAnalyzer.analyze(question);
        } else {
            result = await genericAnalyzer.analyze(question);
        }

        res.json(result);
        
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

// Catch all route - serve index.html for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 TDS Data Analyst Agent running on port ${PORT}`);
    console.log(`🌐 Access at: http://localhost:${PORT}`);
    console.log(`📡 API endpoint: http://localhost:${PORT}/api/analyze`);
});