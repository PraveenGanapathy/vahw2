// Initialize the map chart
function createRetailerMap() {
    const width = 800;
    const height = 500;
    const margin = { top: 20, right: 200, bottom: 20, left: 20 };

    // Clear existing content
    d3.select("#map-chart").selectAll("*").remove();

    // Create SVG container
    const svg = d3.select("#map-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Define retailer colors
    const retailerColors = d3.scaleOrdinal()
        .domain(['Amazon', 'Foot Locker', "Kohl's", 'Sports Direct', 'Walmart', 'West Gear'])
        .range(['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b']);

    // Create projection
    const projection = d3.geoAlbersUsa()
        .scale(width)
        .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // Create tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "white")
        .style("padding", "10px")
        .style("border", "1px solid #ddd")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("z-index", "1000");

    // Load data
    Promise.all([
        d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"),
        d3.json('/api/data')
    ]).then(([usData, salesData]) => {
        if (!usData || !salesData) {
            throw new Error("Failed to load required data");
        }

        // Draw states
        const states = svg.append("g")
            .selectAll("path")
            .data(topojson.feature(usData, usData.objects.states).features)
            .enter()
            .append("path")
            .attr("class", "state")
            .attr("d", path)
            .attr("fill", "#f0f0f0")
            .attr("stroke", "#fff")
            .attr("stroke-width", "0.5px")
            .on("click", function(event, d) {
                event.stopPropagation();
                const stateName = d.properties.name;
                d3.selectAll(".state").style("fill", "#f0f0f0");
                d3.select(this).style("fill", "#d9d9d9");
                if (window.updateAllCharts) {
                    window.updateAllCharts(stateName,salesData);
                }
            });

        // Process and draw retailer data
        topojson.feature(usData, usData.objects.states).features.forEach(feature => {
            const stateName = feature.properties.name;
            const stateValue = salesData.state_data[stateName];
            
            if (stateValue) {
                const centroid = path.centroid(feature);
                const maxSales = d3.max(Object.values(salesData.state_data));
                const radius = Math.sqrt(stateValue / maxSales) * 20;

                // Calculate top retailers
                const stateRetailers = Object.entries(salesData.metrics['Total Sales'])
                    .map(([retailer, totalSales]) => ({
                        retailer,
                        sales: totalSales * (stateValue / d3.sum(Object.values(salesData.state_data)))
                    }))
                    .sort((a, b) => b.sales - a.sales)
                    .slice(0, 3);

                // Draw retailer circles
                stateRetailers.forEach((retailerData, index) => {
                    svg.append("circle")
                        .attr("cx", centroid[0])
                        .attr("cy", centroid[1])
                        .attr("r", radius - (index * 3))
                        .attr("fill", retailerColors(retailerData.retailer))
                        .attr("fill-opacity", 0.7 - (index * 0.15))
                        .attr("stroke", "#fff")
                        .attr("stroke-width", "0.5px")
                        .on("mouseover", function(event) {
                            const tooltipWidth = tooltip.node().getBoundingClientRect().width;
                            const tooltipHeight = tooltip.node().getBoundingClientRect().height;
                            const viewportWidth = window.innerWidth;
                            const viewportHeight = window.innerHeight;

                            let left = event.pageX + 10;
                            let top = event.pageY - 28;

                            if (left + tooltipWidth > viewportWidth) {
                                left = event.pageX - tooltipWidth - 10;
                            }
                            if (top + tooltipHeight > viewportHeight) {
                                top = event.pageY - tooltipHeight - 10;
                            }

                            tooltip.transition()
                                .duration(200)
                                .style("opacity", 0.9);
                            tooltip.html(`
                                <strong>${stateName}</strong><br/>
                                Top Retailers:<br/>
                                ${stateRetailers.map((r, i) => 
                                    `${i + 1}. ${r.retailer}: $${Math.round(r.sales).toLocaleString()}`
                                ).join('<br/>')}
                            `)
                                .style("left", left + "px")
                                .style("top", top + "px");
                        })
                        .on("mouseout", function() {
                            tooltip.transition()
                                .duration(500)
                                .style("opacity", 0);
                        });
                });
            }
        });

        // Add legend
        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${width + 20}, 20)`);

        legend.append("text")
            .attr("class", "legend-title")
            .attr("x", 0)
            .attr("y", -10)
            .text("Retailers")
            .style("font-size", "14px")
            .style("font-weight", "bold");

        retailerColors.domain().forEach((retailer, i) => {
            const legendRow = legend.append("g")
                .attr("transform", `translate(0, ${i * 25 + 20})`);

            legendRow.append("circle")
                .attr("r", 6)
                .attr("fill", retailerColors(retailer))
                .attr("fill-opacity", 0.7);

            legendRow.append("text")
                .attr("x", 15)
                .attr("y", 4)
                .text(retailer)
                .style("font-size", "12px");
        });

    }).catch(error => {
        console.error("Map initialization failed:", error);
        d3.select("#map-chart")
            .append("div")
            .attr("class", "error-message")
            .text("Failed to load map data. Please try refreshing the page.");
    });
}

// Export the function
// Instead of ES6 export
window.createRetailerMap = createRetailerMap;

