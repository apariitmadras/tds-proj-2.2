function calculateCorrelation(x, y) {
    if (x.length !== y.length || x.length === 0) {
        throw new Error('Arrays must have the same non-zero length');
    }
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    if (denominator === 0) return 0;
    
    return numerator / denominator;
}

function calculateRegression(x, y) {
    if (x.length !== y.length || x.length === 0) {
        throw new Error('Arrays must have the same non-zero length');
    }
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
}

function calculateMean(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function calculateStandardDeviation(arr) {
    const mean = calculateMean(arr);
    const variance = arr.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
}

function calculateRSquared(x, y) {
    const { slope, intercept } = calculateRegression(x, y);
    const meanY = calculateMean(y);
    
    let totalSumSquares = 0;
    let residualSumSquares = 0;
    
    for (let i = 0; i < x.length; i++) {
        const predicted = slope * x[i] + intercept;
        totalSumSquares += Math.pow(y[i] - meanY, 2);
        residualSumSquares += Math.pow(y[i] - predicted, 2);
    }
    
    return 1 - (residualSumSquares / totalSumSquares);
}

module.exports = {
    calculateCorrelation,
    calculateRegression,
    calculateMean,
    calculateStandardDeviation,
    calculateRSquared
};