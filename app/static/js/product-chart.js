function createProductChart() {
    const margin = {top: 40, right: 20, bottom: 160, left: 60};
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Clear existing content
    d3.select("#product-chart").selectAll("*").remove();

    const svg = d3.select("#product-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add gradient definition
    const gradient = svg.append("defs")
        .append("linearGradient")
        .attr("id", "bar-gradient")
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%");

    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#4CAF50")
        .attr("stop-opacity", 1);

    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#2E7D32")
        .attr("stop-opacity", 0.8);

    function updateChart(data, stateName = null) {
        let productData;
        let title = stateName ? `Product Sales - ${stateName}` : "Product Sales Distribution";

        if (stateName) {
            const stateProportion = data.state_data[stateName] / d3.sum(Object.values(data.state_data));
            productData = Object.entries(data.product_sales)
                .map(([name, value]) => ({
                    name,
                    value: value * stateProportion,
                    originalValue: value
                }))
                .sort((a, b) => b.value - a.value);
        } else {
            productData = Object.entries(data.product_sales)
                .map(([name, value]) => ({
                    name, 
                    value,
                    originalValue: value
                }))
                .sort((a, b) => b.value - a.value);
        }

        // Update title
        let chartTitle = svg.select(".chart-title");
        if (chartTitle.empty()) {
            chartTitle = svg.append("text")
                .attr("class", "chart-title")
                .attr("x", width / 2)
                .attr("y", -20)
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .style("font-weight", "bold");
        }
        chartTitle.text(title);

        const x = d3.scaleBand()
            .range([0, width])
            .padding(0.2)
            .domain(productData.map(d => d.name));

        const y = d3.scaleLinear()
            .range([height, 0])
            .domain([0, d3.max(productData, d => d.value)]);

        // Create tooltip
        const tooltip = d3.select("body")
            .selectAll(".product-tooltip")
            .data([null])
            .join("div")
            .attr("class", "product-tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background-color", "rgba(255, 255, 255, 0.9)")
            .style("border", "1px solid #ddd")
            .style("border-radius", "4px")
            .style("padding", "8px")
            .style("pointer-events", "none")
            .style("font-size", "12px")
            .style("z-index", "10");

        // Update axes with smooth transitions
        const xAxis = svg.select(".x-axis").empty() ? 
            svg.append("g").attr("class", "x-axis") : 
            svg.select(".x-axis");
        
        xAxis
            .attr("transform", `translate(0,${height})`)
            .transition()
            .duration(500)
            .ease(d3.easeQuadOut)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("transform", "rotate(-45)");

        const yAxis = svg.select(".y-axis").empty() ?
            svg.append("g").attr("class", "y-axis") :
            svg.select(".y-axis");
        
        yAxis
            .transition()
            .duration(500)
            .ease(d3.easeQuadOut)
            .call(d3.axisLeft(y));

        // Update bars with enhanced animation
        const bars = svg.selectAll(".bar")
            .data(productData, d => d.name);

        // Exit
        bars.exit()
            .transition()
            .duration(300)
            .ease(d3.easeQuadIn)
            .attr("y", height)
            .attr("height", 0)
            .remove();

        // Enter
        const barsEnter = bars.enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.name))
            .attr("width", x.bandwidth())
            .attr("y", height)
            .attr("height", 0)
            .style("fill", "url(#bar-gradient)")
            .style("filter", "drop-shadow(0px 3px 3px rgba(0,0,0,0.2))");

        // Update + Enter
        bars.merge(barsEnter)
            .transition()
            .duration(750)
            .ease(d3.easeElasticOut.amplitude(0.8))
            .attr("x", d => x(d.name))
            .attr("width", x.bandwidth())
            .attr("y", d => y(d.value))
            .attr("height", d => height - y(d.value));

        // Add hover interactions
        barsEnter
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .style("filter", "drop-shadow(0px 5px 5px rgba(0,0,0,0.3))")
                    .style("opacity", 1);

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
                    .style("filter", "drop-shadow(0px 3px 3px rgba(0,0,0,0.2))")
                    .style("opacity", 0.9);

                tooltip.style("opacity", 0);
            })
            .on("mousemove", function(event) {
                tooltip
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            });
    }

    return updateChart;
}
