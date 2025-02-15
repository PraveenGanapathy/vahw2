function createRetailerBar() {
    const width = 600;
    const height = 400;
    const margin = {top: 30, right: 30, bottom: 60, left: 80};

    // Clear existing content
    d3.select("#retailer-bar").selectAll("*").remove();

    const svg = d3.select("#retailer-bar")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add title
    svg.append("text")
        .attr("class", "chart-title")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Retailer Distribution");

    function updateChart(data, stateName = null) {
        let retailers;
        let title = "Retailer Distribution";

        if (stateName) {
            const stateProportion = data.state_data[stateName] / d3.sum(Object.values(data.state_data));
            retailers = Object.entries(data.retailer_counts)
                .map(([retailer, count]) => ({
                    name: retailer,
                    value: count * stateProportion,
                    originalValue: count
                }))
                .sort((a, b) => b.value - a.value);
            title = `Retailer Distribution - ${stateName}`;
        } else {
            retailers = Object.entries(data.retailer_counts)
                .map(([retailer, count]) => ({
                    name: retailer,
                    value: count,
                    originalValue: count
                }))
                .sort((a, b) => b.value - a.value);
        }

        // Update title
        svg.select(".chart-title")
            .transition()
            .duration(750)
            .text(title);

        const x = d3.scaleBand()
            .range([0, width])
            .padding(0.2)
            .domain(retailers.map(d => d.name));

        const y = d3.scaleLinear()
            .range([height, 0])
            .domain([0, d3.max(retailers, d => d.value)]);

        // Update X axis
        let xAxis = svg.select(".x-axis");
        if (xAxis.empty()) {
            xAxis = svg.append("g")
                .attr("class", "x-axis")
                .attr("transform", `translate(0,${height})`);
        }
        xAxis.transition().duration(750)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(0)")
            .style("text-anchor", "end")
            .style("font-size", "12px");

        // Update Y axis
        let yAxis = svg.select(".y-axis");
        if (yAxis.empty()) {
            yAxis = svg.append("g")
                .attr("class", "y-axis");
        }
        yAxis.transition().duration(750)
            .call(d3.axisLeft(y))
            .selectAll("text")
            .style("font-size", "12px");

        // Create tooltip
        const tooltip = d3.select("body")
            .selectAll(".retailer-tooltip")
            .data([null])
            .join("div")
            .attr("class", "retailer-tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background-color", "rgba(255, 255, 255, 0.9)")
            .style("border", "1px solid #ddd")
            .style("border-radius", "4px")
            .style("padding", "8px")
            .style("pointer-events", "none")
            .style("font-size", "12px")
            .style("z-index", "10");

        // Update bars
        const bars = svg.selectAll(".bar")
            .data(retailers, d => d.name);

        // Remove old bars
        bars.exit()
            .transition()
            .duration(750)
            .attr("y", height)
            .attr("height", 0)
            .remove();

        // Add new bars
        const barsEnter = bars.enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.name))
            .attr("width", x.bandwidth())
            .attr("y", height)
            .attr("height", 0)
            .style("fill", "#4CAF50")
            .style("opacity", 0.8);

        // Merge and update all bars
        const barsUpdate = bars.merge(barsEnter)
            .transition()
            .duration(750)
            .ease(d3.easeQuadInOut)
            .attr("x", d => x(d.name))
            .attr("width", x.bandwidth())
            .attr("y", d => y(d.value))
            .attr("height", d => height - y(d.value));

        // Add interactions
        barsEnter
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .style("opacity", 1)
                    .style("fill", "#2E7D32");

                tooltip
                    .style("opacity", 1)
                    .html(`
                        <strong>${d.name}</strong><br/>
                        Value: ${Math.round(d.value)}<br/>
                        ${stateName ? `Original: ${Math.round(d.originalValue)}` : ''}
                    `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .style("opacity", 0.8)
                    .style("fill", "#4CAF50");

                tooltip.style("opacity", 0);
            })
            .on("mousemove", function(event) {
                tooltip
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            });

        // Update labels
        const labels = svg.selectAll(".bar-label")
            .data(retailers, d => d.name);

        labels.exit()
            .transition()
            .duration(750)
            .style("opacity", 0)
            .remove();

        const labelsEnter = labels.enter()
            .append("text")
            .attr("class", "bar-label")
            .attr("opacity", 0)
            .attr("x", d => x(d.name) + x.bandwidth() / 2)
            .attr("y", height);

        labels.merge(labelsEnter)
            .transition()
            .duration(750)
            .ease(d3.easeQuadInOut)
            .attr("opacity", 1)
            .attr("x", d => x(d.name) + x.bandwidth() / 2)
            .attr("y", d => y(d.value) - 5)
            .attr("text-anchor", "middle")
            .text(d => Math.round(d.value));
    }

    return updateChart;
}
