const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const { calculateRegression } = require('./statistics');

const width = 800;
const height = 600;

async function generateScatterplot(data, title, xLabel, yLabel) {
    try {
        const chartJSNodeCanvas = new ChartJSNodeCanvas({ 
            width, 
            height,
            backgroundColour: 'white'
        });
        
        // Calculate regression line
        const xValues = data.map(d => d.x);
        const yValues = data.map(d => d.y);
        const { slope, intercept } = calculateRegression(xValues, yValues);
        
        // Generate regression line points
        const minX = Math.min(...xValues);
        const maxX = Math.max(...xValues);
        const regressionData = [
            { x: minX, y: slope * minX + intercept },
            { x: maxX, y: slope * maxX + intercept }
        ];
        
        const configuration = {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'Data Points',
                        data: data,
                        backgroundColor: 'rgba(54, 162, 235, 0.6)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8
                    },
                    {
                        label: 'Regression Line',
                        data: regressionData,
                        type: 'line',
                        borderColor: 'red',
                        borderWidth: 2,
                        borderDash: [5, 5], // Dotted line
                        backgroundColor: 'transparent',
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: title,
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: xLabel,
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: yLabel,
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                }
            }
        };
        
        const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
        const base64Image = imageBuffer.toString('base64');
        
        // Check size limit (100KB = 100,000 bytes)
        if (base64Image.length > 100000) {
            console.warn('Image size exceeds 100KB limit');
        }
        
        return `data:image/png;base64,${base64Image}`;
        
    } catch (error) {
        console.error('Visualization error:', error);
        // Return a simple fallback data URI
        return generateFallbackPlot();
    }
}

function generateFallbackPlot() {
    // Generate a simple SVG as fallback
    const svg = `
        <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="300" fill="white" stroke="black"/>
            <text x="200" y="150" text-anchor="middle" font-family="Arial" font-size="16">
                Chart generation failed - using fallback
            </text>
        </svg>
    `;
    
    const base64 = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
}

async function generateBarChart(data, title, xLabel, yLabel) {
    try {
        const chartJSNodeCanvas = new ChartJSNodeCanvas({ 
            width, 
            height,
            backgroundColour: 'white'
        });
        
        const configuration = {
            type: 'bar',
            data: {
                labels: data.map(d => d.label),
                datasets: [{
                    label: yLabel,
                    data: data.map(d => d.value),
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: title,
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: yLabel
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: xLabel
                        }
                    }
                }
            }
        };
        
        const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
        const base64Image = imageBuffer.toString('base64');
        
        return `data:image/png;base64,${base64Image}`;
        
    } catch (error) {
        console.error('Bar chart error:', error);
        return generateFallbackPlot();
    }
}

module.exports = {
    generateScatterplot,
    generateBarChart
};