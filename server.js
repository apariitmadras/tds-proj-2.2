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
const customAnalyzer = require('./src/analyzers/customAnalyzer');

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
  const { question } = req.body;
  try {
    let result;

    if (question.includes('List of highest grossing films')) {
      result = await wikipediaAnalyzer.analyze(question);
    }

    else if (question.match(/regress\s+\w+\s+vs\s+\w+\s+from/i)) {
      result = await myCustomAnalyzer.analyze(question);
    }

    else {
      result = await genericAnalyzer.analyze(question);
    }

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: "Internal server error", message: err.message });
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
