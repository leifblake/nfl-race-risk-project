import * as d3 from "d3";

const dataPath = "/nfl-race-risk-project/data/cleaned/position_injury_risk.csv";
const width = 1120;
const height = 560;
const margin = { top: 125, right: 60, bottom: 82, left: 92 };

const container = d3.select("#injury-risk");
const tooltip = d3.select("#tooltip");
const chartCard = d3.select(".chart-card");

const svg = container
  .append("svg")
  .attr("viewBox", [0, 0, width, height])
  .attr("width", "100%")
  .attr("height", "100%");

const chart = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

d3.csv(dataPath).then(raw => {
  const data = raw.map(d => ({
    position_group: d.position_group,
    avg_injury_burden: +d.avg_injury_burden,
    total_games_missed: +d.total_games_missed,
    total_games_injured: +d.total_games_injured,
    player_seasons: +d.player_seasons,
    black_share: +d.black_share
  }));

  const x = d3.scaleLinear()
    .domain([
      d3.min(data, d => d.avg_injury_burden) - 0.2,
      d3.max(data, d => d.avg_injury_burden) + 0.2
    ])
    .range([0, innerWidth]);

  const y = d3.scaleLinear()
    .domain([0, 90])
    .range([innerHeight, 0]);

  const radius = d3.scaleSqrt()
    .domain(d3.extent(data, d => d.total_games_missed))
    .range([14, 42]);

  const color = d3.scaleThreshold()
    .domain([50])
    .range(["#F2C57C", "#6C8EBF"]);

  // Grid
  chart.append("g")
    .attr("class", "grid")
    .selectAll("line.horizontal")
    .data(y.ticks(5))
    .join("line")
    .attr("x1", 0)
    .attr("x2", innerWidth)
    .attr("y1", d => y(d))
    .attr("y2", d => y(d));

  chart.append("g")
    .attr("class", "grid")
    .selectAll("line.vertical")
    .data(x.ticks(5))
    .join("line")
    .attr("x1", d => x(d))
    .attr("x2", d => x(d))
    .attr("y1", 0)
    .attr("y2", innerHeight);

  // Axes
  chart.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x).ticks(5));

  chart.append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`));

  // Axis labels
  chart.append("text")
    .attr("x", innerWidth / 2)
    .attr("y", innerHeight + 58)
    .attr("text-anchor", "middle")
    .attr("font-weight", 800)
    .attr("fill", "#252525")
    .text("Average Injury Burden");

  chart.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerHeight / 2)
    .attr("y", -62)
    .attr("text-anchor", "middle")
    .attr("font-weight", 800)
    .attr("fill", "#252525")
    .text("% Black Players in Position Group");

  // Color legend
  const legend = chart.append("g")
    .attr("transform", `translate(${x(6.9)}, ${y(114)})`);

  legend.append("text")
    .attr("x", 0)
    .attr("y", -18)
    .attr("font-size", "18px")
    .attr("font-weight", 900)
    .attr("fill", "#252525")
    .text("KEY: BLACK PLAYER SHARE");

  legend.append("circle")
    .attr("cx", 0)
    .attr("cy", 8)
    .attr("r", 12)
    .attr("fill", "#6C8EBF")
    .attr("stroke", "#2c2c2c")
    .attr("stroke-width", 1.2);

  legend.append("text")
    .attr("x", 22)
    .attr("y", 13)
    .attr("font-size", "15px")
    .attr("font-weight", 700)
    .attr("fill", "#4a4a4a")
    .text("Higher Black representation (>50%)");

  legend.append("circle")
    .attr("cx", 0)
    .attr("cy", 38)
    .attr("r", 12)
    .attr("fill", "#F2C57C")
    .attr("stroke", "#2c2c2c")
    .attr("stroke-width", 1.2);

  legend.append("text")
    .attr("x", 22)
    .attr("y", 43)
    .attr("font-size", "15px")
    .attr("font-weight", 700)
    .attr("fill", "#4a4a4a")
    .text("Lower Black representation (<50%)");

  chart.append("line")
    .attr("x1", x(7.28))
    .attr("x2", x(7.28))
    .attr("y1", y(118))
    .attr("y2", y(98))
    .attr("stroke", "#b9ab9e")
    .attr("stroke-width", 1.2);

  // Bubble-size legend
  const sizeLegend = chart.append("g")
    .attr("transform", `translate(${x(7.35)}, ${y(114)})`);

  sizeLegend.append("text")
    .attr("x", -20)
    .attr("y", -18)
    .attr("font-size", "18px")
    .attr("font-weight", 900)
    .attr("fill", "#252525")
    .text("BUBBLE SIZE: TOTAL GAMES MISSED");

  const sizeItems = [
    { label: "Fewer", r: 11 },
    { label: "Moderate", r: 20 },
    { label: "More", r: 31 }
  ];

  sizeItems.forEach((item, i) => {
    const xPos = i * 90;

    sizeLegend.append("circle")
      .attr("cx", xPos)
      .attr("cy", 25)
      .attr("r", item.r)
      .attr("fill", "#c7c7c7")
      .attr("stroke", "#555")
      .attr("stroke-width", 1);

    sizeLegend.append("text")
      .attr("x", xPos)
      .attr("y", 78)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("fill", "#555")
      .text(item.label);
  });

  // Blue annotation label
  chart.append("text")
    .attr("class", "annotation annotation-blue")
    .attr("x", x(7.78))
    .attr("y", y(106))
    .text("Higher injury burden +");

  chart.append("text")
    .attr("class", "annotation annotation-blue")
    .attr("x", x(7.78))
    .attr("y", y(100))
    .text("higher Black representation");

  // Blue annotation arrow
  chart.append("path")
    .attr("d", `M ${x(7.79)} ${y(97)} Q ${x(7.76)} ${y(86)}, ${x(7.84)} ${y(88)}`)
    .attr("fill", "none")
    .attr("stroke", "#1F5E9C")
    .attr("stroke-width", 2);

  chart.append("path")
    .attr("d", `M ${x(7.84)} ${y(88)} L ${x(7.83)} ${y(90)} L ${x(7.82)} ${y(86)} Z`)
    .attr("fill", "#1F5E9C");

  // Points with quick "slap-on" animation
  const points = chart.selectAll(".point")
    .data(data)
    .join("circle")
    .attr("class", "point")
    .attr("cx", d => x(d.avg_injury_burden))
    .attr("cy", d => y(d.black_share))
    .attr("r", 0)
    .attr("fill", d => color(d.black_share))
    .style("opacity", 0)
    .on("mouseenter", showTooltip)
    .on("mousemove", moveTooltip)
    .on("mouseleave", hideTooltip);

  points
    .transition()
    .duration(120)
    .delay((d, i) => i * 55)
    .ease(d3.easeCubicOut)
    .style("opacity", 1)
    .attr("r", d => radius(d.total_games_missed) * 1.18)
    .transition()
    .duration(180)
    .ease(d3.easeBackOut.overshoot(2.2))
    .attr("r", d => radius(d.total_games_missed));

  // Labels fade in after the circle animation finishes
  chart.selectAll(".point-label")
    .data(data)
    .join("text")
    .attr("class", "point-label")
    .attr("x", d => x(d.avg_injury_burden))
    .attr("y", d => y(d.black_share) + 4)
    .style("opacity", 0)
    .text(d => d.position_group)
    .transition()
    .duration(350)
    .delay((d, i) => i * 55 + 650)
    .ease(d3.easeCubicOut)
    .style("opacity", 1);

  function showTooltip(event, d) {
    tooltip
      .style("display", "block")
      .html(`
        <strong>${d.position_group}</strong>
        Black player share: ${d.black_share.toFixed(1)}%<br>
        Average injury burden: ${d.avg_injury_burden.toFixed(2)}<br>
        Total games missed: ${d.total_games_missed.toLocaleString()}<br>
        Total games injured: ${d.total_games_injured.toLocaleString()}<br>
        Player-seasons: ${d.player_seasons.toLocaleString()}
      `);

    moveTooltip(event);
  }
});

function moveTooltip(event) {
  const bounds = chartCard.node().getBoundingClientRect();

  tooltip
    .style("left", `${event.clientX - bounds.left + 16}px`)
    .style("top", `${event.clientY - bounds.top + 16}px`);
}

function hideTooltip() {
  tooltip.style("display", "none");
}