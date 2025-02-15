function RadarChart(id, data, options) {
    const container = d3.select(id).style("position", "relative");

    // Loading and error indicators
    const loadingDiv = container.append("div")
        .attr("class", "loading")
        .style("display", "none")
        .text("Loading...");
    const errorDiv = container.append("div")
        .attr("class", "error")
        .style("display", "none")
        .text("Error loading data");

    // Tooltip initialization
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "#fff")
        .style("padding", "10px")
        .style("border", "1px solid #ddd")
        .style("border-radius", "4px")
        .style("pointer-events", "none");

    // Configuration
    const cfg = {
        w: 400,
        h: 400,
        margin: { top: 40, right: 150, bottom: 40, left: 40 },
        levels: 5,
        maxValue: 1.0,
        labelFactor: 1.15,
        wrapWidth: 60,
        opacityArea: 0.35,
        dotRadius: 4,
        strokeWidth: 2,
        roundStrokes: true,
        transitionDuration: 800,
        color: d3.scaleOrdinal().range(['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'])
    };

    if (options) {
        Object.keys(options).forEach(key => {
            if (options[key] !== undefined) cfg[key] = options[key];
        });
    }

    function showLoading() {
        loadingDiv.style("display", "block");
        errorDiv.style("display", "none");
    }

    function hideLoading() {
        loadingDiv.style("display", "none");
    }

    function showError(message) {
        errorDiv.style("display", "block").text(message);
    }

    function drawRadarChart(radarData, axes) {
        const radius = Math.min(cfg.w / 2, cfg.h / 2);
        const angleSlice = Math.PI * 2 / axes.length;

        // Clear existing chart
        d3.select(id).selectAll("*").remove();

        // Create SVG container
        const svg = d3.select(id)
        .append("svg")
        .attr("width", cfg.w + cfg.margin.left + cfg.margin.right+ 250)
        .attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
        .append("g")
        .attr("transform", `translate(${cfg.w / 2 + cfg.margin.left+200},${cfg.h / 2 + cfg.margin.top})`);
    
   



        // Circular grid
        const axisGrid = svg.append("g").attr("class", "axisWrapper");
        
        axisGrid.selectAll(".levels")
            .data(d3.range(1, cfg.levels + 1).reverse())
            .enter()
            .append("circle")
            .attr("class", "gridCircle")
            .attr("r", d => radius / cfg.levels * d)
            .style("fill", "#CDCDCD")
            .style("stroke", "#CDCDCD")
            .style("fill-opacity", 0.1);

        // Axes
        const axis = axisGrid.selectAll(".axis")
            .data(axes)
            .enter()
            .append("g")
            .attr("class", "axis");

        axis.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr(
                "x2",
                (d, i) => radius * Math.cos(angleSlice * i - Math.PI / 2)
            )
            .attr(
                "y2",
                (d, i) => radius * Math.sin(angleSlice * i - Math.PI / 2)
            )
            .style("stroke-width", cfg.strokeWidth)
            .style("stroke", "#737373");

        axis.append("text")
            .attr("class", "legend")
            .text(d => `${d}`)
            .attr(
                "x",
                (d, i) => radius * cfg.labelFactor * Math.cos(angleSlice * i - Math.PI / 2)
            )
            .attr(
                "y",
                (d, i) => radius * cfg.labelFactor * Math.sin(angleSlice * i - Math.PI / 2)
            )
            .style('font-size', '12px')
            .attr('text-anchor', 'middle');

        // Radar area
        const radarLine = d3.lineRadial()
            .curve(d3.curveLinearClosed)
            .radius(d => d.value * radius)
            .angle((d, i) => i * angleSlice);

        radarData.forEach((d, i) => {
            svg.append('path')
                .datum(d.axes)
                .attr('class', 'radarArea')
                .attr('d', radarLine)
                .style('fill', cfg.color(i))
                .style('fill-opacity', cfg.opacityArea)
                .style('stroke-width', cfg.strokeWidth)
                .style('stroke', cfg.color(i))
                // Tooltip on hover
                .on('mouseover', function(event) {
                    tooltip.transition().duration(200).style('opacity', 0.9);
                    tooltip.html(`
                        <strong>${d.name}</strong><br/>
                        ${d.axes.map(a => `${a.axis}: ${Math.round(a.rawValue)}`).join('<br/>')}
                        
                    `)
                        .style('left', `${event.pageX + 10}px`)
                        .style('top', `${event.pageY - 28}px`);
                    d3.select(this).transition().duration(200).style('fill-opacity', 0.7);
                })                
                .on('mouseout', function() {
                    tooltip.transition().duration(500).style('opacity', 0);
                    d3.select(this).transition().duration(200).style('fill-opacity', cfg.opacityArea);
                });
            

            // Add dots for each point
            svg.selectAll(`.radarCircle-${i}`)
                .data(d.axes)
                .enter()
                .append('circle')
                .attr('class', `radarCircle radarCircle-${i}`)
                .attr('r', cfg.dotRadius)
                .attr(
                    'cx',
                    (a, j) =>
                        radius *
                        a.value *
                        Math.cos(angleSlice * j - Math.PI / 2)
                )
                .attr(
                    'cy',
                    (a, j) =>
                        radius *
                        a.value *
                        Math.sin(angleSlice * j - Math.PI / 2)
                )
                .style('fill', cfg.color(i))
                .style('fill-opacity', 0.8)
                // Tooltip for dots
                .on('mouseover', function(event, a) {
                    tooltip.transition().duration(200).style('opacity', 0.9);
                    tooltip.html(`
                        <strong>${d.name}</strong><br/>
                        ${a.axis}: ${Math.round(a.rawValue)}M
                    `)
                        .style('left', `${event.pageX + 10}px`)
                        .style('top', `${event.pageY - 28}px`);
                    d3.select(this).transition().duration(200).attr('r', cfg.dotRadius * 1.5);
                })
                .on('mouseout', function() {
                    tooltip.transition().duration(500).style('opacity', 0);
                    d3.select(this).transition().duration(200).attr('r', cfg.dotRadius);
                });
        });

// Update the legend section in drawRadarChart function
const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${radius + cfg.margin.right / 2}, -${radius})`);

radarData.forEach((d, i) => {
    const legendRow = legend.append("g")
        .attr("transform", `translate(0, ${i * 20})`);

    legendRow.append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", cfg.color(i));

    legendRow.append("text")
        .attr("x", 20)
        .attr("y", 9)
        .text(`${d.name} `) // Show original total in legend
        .style("font-size", "12px")
        .style("alignment-baseline", "middle");
});

    }

    return function updateChart(data, stateName = null) {
        

        showLoading();
        

        if (!data || !data.metrics) {
            showError("Invalid data format");
            return;
        }

        const metrics = data.metrics;
        const axes = ['Operating Profit', 'Total Sales', 'Units Sold'];

        try {
            // Calculate global maxValues for consistent scaling
            const maxValues = {};
            axes.forEach(axis => {
                maxValues[axis] = d3.max(Object.values(metrics[axis]));
            });
// Inside updateChart function
let stateMultiplier = 1;
if (stateName && data.state_data[stateName]) {
    const totalStateValue = d3.sum(Object.values(data.state_data));
    stateMultiplier = (data.state_data[stateName] / totalStateValue) * 200; // Scale for visualization
}

// Create two sets of metrics - one original and one scaled
const stateMetrics = {};
const scaledMetrics = {};
axes.forEach(axis => {
    stateMetrics[axis] = {};
    scaledMetrics[axis] = {};
    Object.keys(metrics[axis]).forEach(retailer => {
        // Calculate state-specific values
        const stateValue = stateName ? 
            (metrics[axis][retailer] * data.state_data[stateName] / d3.sum(Object.values(data.state_data))) :
            metrics[axis][retailer];
            
        // Keep state-specific values
        stateMetrics[axis][retailer] = stateValue;
        // Create scaled version for visualization
        scaledMetrics[axis][retailer] = stateValue * stateMultiplier;
    });
});

// Modify the radarData creation
const radarData = Object.keys(metrics['Operating Profit'])
    .map(retailer => ({
        name: retailer,
        totalValue: axes.reduce((sum, axis) => sum + scaledMetrics[axis][retailer], 0),
        originalTotal: axes.reduce((sum, axis) => sum + stateMetrics[axis][retailer], 0),
        axes: axes.map(axis => ({
            axis: axis,
            value: scaledMetrics[axis][retailer] / maxValues[axis], // Scaled for visualization
            rawValue: stateMetrics[axis][retailer] // State-specific value for tooltips
        }))
    }))
    .sort((a, b) => b.totalValue - a.totalValue);




            hideLoading();
            drawRadarChart(radarData, axes);

        } catch (error) {
            console.error("Error processing radar chart data:", error);
            showError("Error processing data");
        }
    };
}

