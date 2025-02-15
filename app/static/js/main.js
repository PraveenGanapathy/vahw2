// Global variables
let currentData = null;

// State display update function
function updateStateDisplay(stateName) {
    const stateDisplay = document.getElementById('current-state');
    stateDisplay.textContent = `Viewing: ${stateName || 'Entire US'}`;
}

// Global update function for all charts
function updateAllCharts(stateName) {
    if (currentData) {
        if (window.updateRadarChart) {
            window.updateRadarChart(currentData, stateName);
        }
        updateProductChart(currentData, stateName);
        updateRetailerBar(currentData, stateName);
        if (window.updateMapChart) {
            window.updateMapChart(stateName);
        }
        updateStateDisplay(stateName);
    }
}

// Initialize charts
async function initializeCharts() {
    try {
        // Load the data
        const response = await fetch('/api/data');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        currentData = await response.json();
        
        // Initialize radar chart with proper configuration
        const radarChartOptions = {
            w: 300,
            h: 300,
            margin: {top: 50, right: 180, bottom: 50, left: 50},
            levels: 5,
            maxValue: 0.5,
            roundStrokes: true,
            color: d3.scaleOrdinal().range(["#EDC951","#CC333F","#00A0B0"]),
            radius: 5,
            factor: 1,
            factorLegend: 0.85,
            opacityArea: 0.5
        };

        // Create radar chart instance
        window.updateRadarChart = RadarChart("#radar-chart", radarChartOptions);

        // Initialize other charts
        window.updateProductChart = createProductChart();
        window.updateRetailerBar = createRetailerBar();
        
        // Initialize map
        await createRetailerMap();
        
        // Initial updates
        updateAllCharts(null);

        // Add reset button listener
        document.getElementById('reset-view').addEventListener('click', () => {
            updateAllCharts(null);
        });

    } catch (error) {
        console.error('Error initializing charts:', error);
        document.querySelectorAll('.viz-card').forEach(card => {
            card.innerHTML = `
                <div class="error-message">
                    Failed to load chart data. Please refresh the page.
                </div>
            `;
        });
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', initializeCharts);
