// Define a date parser function using d3's timeParse
const parseDate = d3.timeParse("%Y-%m-%d");

// Load the CSV file and process the data
d3.csv("./temperature_daily.csv").then(data => {
// Parse the date and convert temperature values to numbers

  data.forEach(d => {
    d.date = parseDate(d.date);
    d.max_temperature = +d.max_temperature;
    d.min_temperature = +d.min_temperature;
  });
  console.log("Loaded Data:", data);

// Aggregate the data by year and month, calculating max and min temperatures

  const aggregatedData = d3.rollup(
    data,
    values => ({
      max: d3.max(values, d => d.max_temperature),
      min: d3.min(values, d => d.min_temperature)
    }),
    d => d.date.getFullYear(),
    d => d.date.getMonth() + 1
  );

// Process aggregated data into a flat array 
  const processedData = [];
  aggregatedData.forEach((months, year) => {
    months.forEach((temps, month) => {
      processedData.push({
        year: +year,
        month: +month,
        max: temps.max,
        min: temps.min
      });
    });
  });

  // Set margin and dimensions for the first heatmap SVG container

  const margin = { top: 50, right: 30, bottom: 80, left: 80 },
    width = 900 - margin.left - margin.right,
    height = 450 - margin.top - margin.bottom;
  // Create the first SVG container for the heatmap

  const svg1 = d3.select("#heatmap")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Create the x and y scales for the heatmap

  const xScale = d3.scaleBand()
    .domain([...new Set(processedData.map(d => d.year))])
    .range([0, width])
    .padding(0.1);

  const yScale = d3.scaleBand()
    .domain([...new Set(processedData.map(d => d.month))])
    .range([0, height])
    .padding(0.1);

  const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
    .domain([
      d3.min(processedData, d => d.min),
      d3.max(processedData, d => d.max)
    ]);

  // Function to update the heatmap matrix based on temperature type (max or min)

  function updateMatrix(tempType) {
    const cells = svg1.selectAll(".matrix")
      .data(processedData, d => `${d.year}-${d.month}`);

    cells.enter()
      .append("rect")
      .attr("class", "matrix")
      .attr("x", d => xScale(d.year))
      .attr("y", d => yScale(d.month))
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .merge(cells)
      .transition()
      .duration(500)
      .attr("fill", d => colorScale(d[tempType]));

    cells.exit().remove();

    // Tooltip functionality for displaying temperature info on hover
  
    svg1.selectAll(".matrix")
      .on("mouseover", function(event, d) {
        d3.select(".tooltip")
          .style("display", "block")
          .html(`Date: ${d.year}-${d.month}<br>Max: ${d.max}°C<br>Min: ${d.min}°C`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mousemove", function(event) {
        d3.select(".tooltip")
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", function() {
        d3.select(".tooltip").style("display", "none");
      });
  }
// Initialize heatmap with max temperature
  updateMatrix("max");

// Create axes for the heatmap 
  svg1.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));
  svg1.append("g")
    .call(d3.axisLeft(yScale)
      .tickFormat(d => d3.timeFormat("%B")(new Date(0, d - 1))));

// Create the legend for the color scale
    const legendWidth1 = 300,
    legendHeight1 = 10;

  const legendGroup1 = d3.select("#heatmap")
    .append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${margin.left}, ${height + margin.top + 20})`);

  const defs1 = legendGroup1.append("defs");
  const gradient1 = defs1.append("linearGradient")
    .attr("id", "legend-gradient-1");

  // Create gradient stops for the legend
  gradient1.selectAll("stop")
    .data(d3.range(0, 1.01, 0.01))
    .enter()
    .append("stop")
    .attr("offset", d => d)
    .attr("stop-color", d => d3.interpolateYlOrRd(d));
 
  // Append the legend rectangle
  legendGroup1.append("rect")
    .attr("width", legendWidth1)
    .attr("height", legendHeight1)
    .style("fill", "url(#legend-gradient-1)");

  function aggregatedExtent(tempType) {
    return tempType === "max"
      ? d3.extent(processedData, d => d.max)
      : d3.extent(processedData, d => d.min);
  }

  // Create a scale for the legend
  const legendScale1 = d3.scaleLinear()
    .domain(aggregatedExtent("max"))
    .range([0, legendWidth1]);

  // Create axis for the legend  
  const legendAxisGroup1 = legendGroup1.append("g")
    .attr("transform", `translate(0, ${legendHeight1})`)
    .call(d3.axisBottom(legendScale1).ticks(5));

  // Get the data for the most recent 10 years  
  const maxYearData = d3.max(data, d => d.date.getFullYear());
  const filteredData = data.filter(d => d.date.getFullYear() >= maxYearData - 9);

  // Create a map of daily data
  const dailyDataMap = d3.rollup(
    filteredData,
    v => v.sort((a, b) => d3.ascending(a.date, b.date)),
    d => d.date.getFullYear(),
    d => d.date.getMonth() + 1
  );

  // Process daily data into a flat array
  const processedDailyData = [];
  dailyDataMap.forEach((months, year) => {
    months.forEach((days, month) => {
      processedDailyData.push({
        year: +year,
        month: +month,
        days: days
      });
    });
  });

// Set margin and dimensions for the second heatmap SVG container
  const margin2 = { top: 50, right: 30, bottom: 100, left: 80 },
    width2 = 900 - margin2.left - margin2.right,
    height2 = 500 - margin2.top - margin2.bottom;

// Create the second SVG container for the heatmap
  const svg2 = d3.select("#heatmap2")
    .append("g")
    .attr("transform", `translate(${margin2.left},${margin2.top})`);

 // Define scales for the second heatmap    
  const years2 = [...new Set(processedDailyData.map(d => d.year))].sort((a, b) => a - b);
  const months2 = [...new Set(processedDailyData.map(d => d.month))].sort((a, b) => a - b);

  const xScale2 = d3.scaleBand()
    .domain(years2)
    .range([0, width2])
    .padding(0.1);

  const yScale2 = d3.scaleBand()
    .domain(months2)
    .range([0, height2])
    .padding(0.1);


  function getGlobalTempExtent(tempType) {
    return tempType === "max"
      ? d3.extent(filteredData, d => d.max_temperature)
      : d3.extent(filteredData, d => d.min_temperature);
  }


  const globalMiniExtent = [
    d3.min(filteredData, d => d.min_temperature),
    d3.max(filteredData, d => d.max_temperature)
  ];

 // Function to update the second heatmap matrix based on daily temperature data

  function updateMatrix2(tempType) {
    const [globalAggMin, globalAggMax] = getGlobalTempExtent(tempType);
    const colorScale2 = d3.scaleSequential(d3.interpolateYlOrRd)
      .domain([globalAggMin, globalAggMax]);

    const cells = svg2.selectAll(".cell")
      .data(processedDailyData, d => `${d.year}-${d.month}`);

    const cellsEnter = cells.enter()
      .append("g")
      .attr("class", "cell")
      .attr("transform", d => `translate(${xScale2(d.year)},${yScale2(d.month)})`);
    cellsEnter.append("rect")
      .attr("class", "cell-bg")
      .attr("width", xScale2.bandwidth())
      .attr("height", yScale2.bandwidth());

    cellsEnter.append("path")
      .attr("class", "mini-line-max")
      .attr("fill", "none")
      .attr("stroke", "green")
      .attr("stroke-width", 1.5);
    cellsEnter.append("path")
      .attr("class", "mini-line-min")
      .attr("fill", "none")
      .attr("stroke", "blue")
      .attr("stroke-width", 1.5);

    const cellsMerge = cellsEnter.merge(cells);

    cellsMerge.select("rect.cell-bg")
      .transition()
      .duration(500)
      .attr("fill", d => {
        const aggVal = tempType === "max"
          ? d3.max(d.days, day => day.max_temperature)
          : d3.min(d.days, day => day.min_temperature);
        return colorScale2(aggVal);
      });

    cellsMerge.each(function(d) {
      const cellWidth = xScale2.bandwidth();
      const cellHeight = yScale2.bandwidth();

      const xMini = d3.scaleLinear()
        .domain([1, d.days.length])
        .range([0, cellWidth]);

      const yMini = d3.scaleLinear()
        .domain(globalMiniExtent)
        .range([cellHeight, 0]);

      const lineMax = d3.line()
        .x((_, i) => xMini(i + 1))
        .y(day => yMini(day.max_temperature));
      const lineMin = d3.line()
        .x((_, i) => xMini(i + 1))
        .y(day => yMini(day.min_temperature));

      d3.select(this).select("path.mini-line-max")
        .transition()
        .duration(500)
        .attr("d", lineMax(d.days));
      d3.select(this).select("path.mini-line-min")
        .transition()
        .duration(500)
        .attr("d", lineMin(d.days));
    });

    cellsMerge
      .on("mouseover", function(event, d) {
        const [mx] = d3.pointer(event, this);
        const dayIndex = Math.floor((mx / xScale2.bandwidth()) * d.days.length);
        const dayData = d.days[dayIndex];
        if(dayData) {
          d3.select(".tooltip")
            .style("display", "block")
            .html(`Date: ${d3.timeFormat("%Y-%m-%d")(dayData.date)}<br>Max: ${dayData.max_temperature}°C<br>Min: ${dayData.min_temperature}°C`);
        }
      })
      .on("mousemove", function(event, d) {
        const [mx] = d3.pointer(event, this);
        const dayIndex = Math.floor((mx / xScale2.bandwidth()) * d.days.length);
        const dayData = d.days[dayIndex];
        if(dayData) {
          d3.select(".tooltip")
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
        }
      })
      .on("mouseout", function() {
        d3.select(".tooltip").style("display", "none");
      });

    cells.exit().remove();
  }

  // Initialize the second heatmap
  updateMatrix2("max");

  svg2.append("g")
    .attr("transform", `translate(0,${height2})`)
    .call(d3.axisBottom(xScale2).tickFormat(d3.format("d")));
  svg2.append("g")
    .call(d3.axisLeft(yScale2)
      .tickFormat(d => d3.timeFormat("%B")(new Date(0, d - 1))));

 // Create the legend for the color scale
  const legendWidth2 = 300,
    legendHeight2 = 10;

  const legendGroup2 = d3.select("#heatmap2")
    .append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${margin2.left}, ${height2 + margin2.top + 20})`);

  const defs2 = legendGroup2.append("defs");
  const gradient2 = defs2.append("linearGradient")
    .attr("id", "legend-gradient-2");

  // Create gradient stops for the legend
  gradient2.selectAll("stop")
    .data(d3.range(0, 1.01, 0.01))
    .enter()
    .append("stop")
    .attr("offset", d => d)
    .attr("stop-color", d => d3.interpolateYlOrRd(d));

  legendGroup2.append("rect")
    .attr("width", legendWidth2)
    .attr("height", legendHeight2)
    .style("fill", "url(#legend-gradient-2)");


  // Create a scale for the legend
  const legendScale2 = d3.scaleLinear()
    .domain(getGlobalTempExtent("max"))
    .range([0, legendWidth2]);

   // Create axis for the legend
  const legendAxisGroup2 = legendGroup2.append("g")
    .attr("transform", `translate(0, ${legendHeight2})`)
    .call(d3.axisBottom(legendScale2).ticks(5));

  const miniLegendGroup = d3.select("#heatmap2")
    .append("g")
    .attr("class", "mini-legend")
    .attr("transform", `translate(${margin2.left}, ${height2 + margin2.top + 60})`);

  // Create miniLegendGroup
  miniLegendGroup.append("line")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", 20)
    .attr("y2", 0)
    .attr("stroke", "green")
    .attr("stroke-width", 2);
  miniLegendGroup.append("text")
    .attr("x", 25)
    .attr("y", 5)
    .text("Max Temperature");
  miniLegendGroup.append("line")
    .attr("x1", 150)
    .attr("y1", 0)
    .attr("x2", 170)
    .attr("y2", 0)
    .attr("stroke", "blue")
    .attr("stroke-width", 2);
  miniLegendGroup.append("text")
    .attr("x", 175)
    .attr("y", 5)
    .text("Min Temperature");


  d3.selectAll("input[name='tempType']").on("change", function () {
    const selectedType = this.value;
    updateMatrix(selectedType);
    updateMatrix2(selectedType);
    legendScale1.domain(aggregatedExtent(selectedType));
    legendAxisGroup1.transition()
      .duration(500)
      .call(d3.axisBottom(legendScale1).ticks(5));
    legendScale2.domain(getGlobalTempExtent(selectedType));
    legendAxisGroup2.transition()
      .duration(500)
      .call(d3.axisBottom(legendScale2).ticks(5));
  });
});
