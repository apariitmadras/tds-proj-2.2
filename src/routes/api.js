const express = require('express');
const router = express.Router();
const wikipediaAnalyzer = require('../src/analyzers/wikipediaAnalyzer');
const courtDataAnalyzer = require('../src/analyzers/courtDataAnalyzer');
const genericAnalyzer = require('../src/analyzers/genericAnalyzer');

// Middleware to parse text body
router.use(express.text({ limit: '10mb' }));
router.use(express.json({ limit: '10mb' }));

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Main API endpoint
router.post('/', async (req, res) => {
  try {
    console.log('📥 Received request');
    console.log('Content-Type:', req.get('Content-Type'));
    
    // Get the question from request body
    let question;
    if (typeof req.body === 'string') {
      question = req.body;
    } else if (req.body && typeof req.body === 'object') {
      question = req.body.question || req.body.query || JSON.stringify(req.body);
    } else {
      throw new Error('Invalid request body format');
    }

    if (!question || question.trim() === '') {
      return res.status(400).json({ error: 'Question is required' });
    }

    console.log('📝 Processing question:', question.substring(0, 100) + '...');

    // Determine which analyzer to use based on the question content
    let result;
    
    if (question.toLowerCase().includes('wikipedia') && 
        question.toLowerCase().includes('highest-grossing films')) {
      console.log('🎬 Using Wikipedia analyzer');
      result = await wikipediaAnalyzer.analyze(question);
    } else if (question.toLowerCase().includes('indian high court') || 
               question.toLowerCase().includes('judgments') ||
               question.toLowerCase().includes('court_code')) {
      console.log('⚖️  Using Court Data analyzer');
      result = await courtDataAnalyzer.analyze(question);
    } else {
      console.log('🔍 Using Generic analyzer');
      result = await genericAnalyzer.analyze(question);
    }

    console.log('✅ Analysis complete');
    console.log('📤 Sending response:', typeof result);

    // Ensure we return the result in the correct format
    if (typeof result === 'string') {
      try {
        // Try to parse as JSON first
        const parsed = JSON.parse(result);
        res.json(parsed);
      } catch (e) {
        // If not JSON, return as string
        res.json(result);
      }
    } else {
      res.json(result);
    }

  } catch (error) {
    console.error('❌ Error processing request:', error);
    
    // Return error in a format that won't break the evaluation
    const errorResponse = {
      error: 'Analysis failed',
      message: error.message,
      timestamp: new Date().toISOString()
    };
    
    res.status(500).json(errorResponse);
  }
});

// Fallback for other HTTP methods
router.all('/', (req, res) => {
  res.status(405).json({ 
    error: 'Method not allowed',
    message: 'Only POST requests are supported',
    method: req.method
  });
});

module.exports = router;
