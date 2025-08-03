const axios = require('axios');
const fs = require('fs');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000/api';
const HEALTH_URL = process.env.HEALTH_URL || 'http://localhost:3000/api/health';
const TIMEOUT = 180000; // 3 minutes

// Test cases
const testCases = [
  {
    name: 'Wikipedia Movies Test',
    question: `Scrape the list of highest grossing films from Wikipedia. It is at the URL:
https://en.wikipedia.org/wiki/List_of_highest-grossing_films

Answer the following questions and respond with a JSON array of strings containing the answer.

1. How many $2 bn movies were released before 2020?
2. Which is the earliest film that grossed over $1.5 bn?
3. What's the correlation between the Rank and Peak?
4. Draw a scatterplot of Rank and Peak along with a dotted red regression line through it.
   Return as a base-64 encoded data URI, \`"data:image/png;base64,iVBORw0KG..."\` under 100,000 bytes.`,
    expectedFormat: 'array',
    expectedLength: 4
  },
  {
    name: 'Simple Analysis Test',
    question: 'Generate a dataset of 100 random points and calculate the mean and standard deviation. Return as JSON object with keys "mean" and "std".',
    expectedFormat: 'object',
    expectedKeys: ['mean', 'std']
  }
];

// Test function
async function runTest(testCase) {
  console.log(`\n🧪 Running test: ${testCase.name}`);
  console.log('=' .repeat(50));
  
  try {
    const startTime = Date.now();
    
    const response = await axios.post(API_URL, testCase.question, {
      headers: {
        'Content-Type': 'text/plain',
      },
      timeout: TIMEOUT,
    });
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`✅ Response received in ${duration.toFixed(2)}s`);
    console.log(`📊 Response status: ${response.status}`);
    
    // Parse response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(response.data);
    } catch (e) {
      console.log('❌ Response is not valid JSON');
      console.log('Response:', response.data);
      return false;
    }
    
    // Validate format
    if (testCase.expectedFormat === 'array') {
      if (!Array.isArray(parsedResponse)) {
        console.log('❌ Expected array, got:', typeof parsedResponse);
        return false;
      }
      if (testCase.expectedLength && parsedResponse.length !== testCase.expectedLength) {
        console.log(`❌ Expected array length ${testCase.expectedLength}, got ${parsedResponse.length}`);
        return false;
      }
    } else if (testCase.expectedFormat === 'object') {
      if (typeof parsedResponse !== 'object' || Array.isArray(parsedResponse)) {
        console.log('❌ Expected object, got:', typeof parsedResponse);
        return false;
      }
      if (testCase.expectedKeys) {
        for (const key of testCase.expectedKeys) {
          if (!(key in parsedResponse)) {
            console.log(`❌ Missing expected key: ${key}`);
            return false;
          }
        }
      }
    }
    
    console.log('✅ Format validation passed');
    console.log('📋 Response preview:', JSON.stringify(parsedResponse, null, 2).substring(0, 500));
    
    return true;
    
  } catch (error) {
    console.log('❌ Test failed with error:');
    if (error.response) {
      console.log(`HTTP ${error.response.status}: ${error.response.statusText}`);
      console.log('Response:', error.response.data);
    } else if (error.request) {
      console.log('No response received:', error.message);
    } else {
      console.log('Error:', error.message);
    }
    return false;
  }
}

// Health check
async function healthCheck() {
  console.log('🏥 Performing health check...');
  try {
    const response = await axios.get(HEALTH_URL, {
      timeout: 5000,
    });
    console.log('✅ Health check passed');
    console.log('📊 Server status:', response.data.status);
    return true;
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    return false;
  }
}

// Main test runner
async function main() {
  console.log('🚀 Data Analyst Agent Test Suite');
  console.log('='.repeat(50));
  console.log(`🎯 Target API: ${API_URL}`);
  console.log(`⏱️  Timeout: ${TIMEOUT / 1000}s`);
  
  // Health check first
  const healthOk = await healthCheck();
  if (!healthOk) {
    console.log('❌ Health check failed. Exiting...');
    process.exit(1);
  }
  
  // Run tests
  let passed = 0;
  let total = testCases.length;
  
  for (const testCase of testCases) {
    const result = await runTest(testCase);
    if (result) {
      passed++;
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('=' .repeat(50));
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  console.log(`📈 Success Rate: ${(passed / total * 100).toFixed(1)}%`);
  
  if (passed === total) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('💥 Some tests failed');
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.length > 2) {
  const customUrl = process.argv[2];
  process.env.API_URL = customUrl;
  console.log(`🔧 Using custom API URL: ${customUrl}`);
}

// Run tests
main().catch(console.error);
