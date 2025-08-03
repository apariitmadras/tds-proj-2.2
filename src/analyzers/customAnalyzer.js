// This file creates a custom analyzer

// STEP 1: Import helper tools
const { fetchTable } = require('../utils/scraper');           // For downloading tables
const { linearRegression } = require('../utils/statistics');  // For doing math
const { makeScatter } = require('../utils/visualization');    // For drawing chart

// STEP 2: Export one function called "analyze"
module.exports = {
  async analyze(question) {
    // 1. Look at the question text
    const match = question.match(/regress\s+(\w+)\s+vs\s+(\w+)\s+from\s+(https?:\/\/\S+)/i);

    // If the question doesn't match the pattern, stop
    if (!match) {
      throw new Error("Sorry, I don't understand this question");
    }

    // 2. Get the pieces from the question
    const [, yCol, xCol, url] = match;  // example: "Price vs Age from https://..."

    // 3. Download the data table from the webpage
    const data = await fetchTable(url);  // returns array of rows like [{Price: 10, Age: 2}, ...]

    // 4. Do the math: fit a regression line
    const { slope, intercept } = linearRegression(data, xCol, yCol);

    // 5. Make a chart with red dotted regression line
    const chart = await makeScatter(data, xCol, yCol, {
      regression: { slope, intercept, style: 'dotted' }
    });

    // 6. Return the answer as an object
    return {
      slope,        // a number
      intercept,    // a number
      chart         // a base64 image string (to show chart)
    };
  }
};
