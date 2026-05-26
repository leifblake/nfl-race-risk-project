import * as d3 from "d3";

const demographicPath = "/data/cleaned/modern_position_race_summary.csv";
const riskPath = "/data/manual/position_power_risk.csv";

const width = 1120;
const height = 620;
const margin = { top: 40, right: 60, bottom: 80, left: 90 };

const tooltip = d3.select("#tooltip");
const chartCard = d3.select(".chart-card");

Promise.all([
  d3.csv(demographicPath),
  d3.csv(riskPath)
]).then(([demo, risk]) => {
  const shares = {
    Black: buildShareMap(demo, "Black"),
    White: buildShareMap(demo, "White")
  };

  drawBubbleChart({
    selector: "#risk-authority-black",
    demoShare: shares.Black,
    raceLabel: "Black",
    lowColor: "#D7E3F3",
    midColor: "#7FA6CC",
    highColor: "#355C7D",
    lowLegend: "Lower % Black Players",
    highLegend: "Higher % Black Players",
    risk,
    chartTitle: "Distribution of Black Players",
  });

  drawBubbleChart({
    selector: "#risk-authority-white",
    demoShare: shares.White,
    raceLabel: "White",
    lowColor: "#FFF2D2",
    midColor: "#F2C57C",
    highColor: "#B9822E",
    lowLegend: "Lower % White Players",
    highLegend: "Higher % White Players",
    risk,
    chartTitle: "Distribution of White Players",
  });
});

function buildShareMap(demo, raceName) {
  const map = new Map();

  demo.forEach(d => {
    if (d.race === raceName) {
      map.set(d.position_group, +d.percent_of_position);
    }
  });

  return map;
}

function drawBubbleChart({
  selector,
  demoShare,
  raceLabel,
  lowColor,
  midColor,
  highColor,
  lowLegend,
  highLegend,
  risk,
  chartTitle
}) {
  const container = d3.select(selector);

  const svg = container
    .append("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("width", "100%")
    .attr("height", "100%");

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const chart = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 24)
    .attr("fill", "#2a2a2a")
    .attr("font-size", "24px")
    .attr("font-weight", 800)
    .attr("text-anchor", "middle")
    .text(chartTitle);

  const data = risk.map(d => ({
    position_group: d.position_group,
    risk_score: +d.risk_score,
    authority_score: +d.authority_score,
    risk_level: d.risk_level,
    authority_level: d.authority_level,
    risk_description: d.risk_description,
    authority_description: d.authority_description,
    share_percent: demoShare.get(d.position_group) || 0
  }));

  const x = d3.scaleLinear()
    .domain([0.5, 5.5])
    .range([0, innerWidth]);

  const y = d3.scaleLinear()
    .domain([0.5, 5.5])
    .range([innerHeight, 0]);

  const r = d3.scaleSqrt()
    .domain([0, d3.max(data, d => d.share_percent)])
    .range([12, 52]);

  const color = d3.scaleLinear()
    .domain([0, 50, 85])
    .range([lowColor, midColor, highColor]);

  chart.append("g")
    .attr("class", "grid")
    .selectAll("line.vertical")
    .data(d3.range(1, 6))
    .join("line")
    .attr("x1", d => x(d))
    .attr("x2", d => x(d))
    .attr("y1", 0)
    .attr("y2", innerHeight);

  chart.append("g")
    .attr("class", "grid")
    .selectAll("line.horizontal")
    .data(d3.range(1, 6))
    .join("line")
    .attr("y1", d => y(d))
    .attr("y2", d => y(d))
    .attr("x1", 0)
    .attr("x2", innerWidth);

  chart.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(
      d3.axisBottom(x)
        .tickValues([1, 2, 3, 4, 5])
        .tickFormat(d => {
          if (d === 1) return "Lower";
          if (d === 3) return "Medium";
          if (d === 5) return "Higher";
          return "";
        })
    );

  chart.append("g")
    .attr("class", "axis")
    .call(
      d3.axisLeft(y)
        .tickValues([1, 2, 3, 4, 5])
        .tickFormat(d => {
          if (d === 1) return "Lower";
          if (d === 3) return "Medium";
          if (d === 5) return "Higher";
          return "";
        })
    );

  chart.append("text")
    .attr("x", innerWidth / 2)
    .attr("y", innerHeight + 58)
    .attr("text-anchor", "middle")
    .attr("font-weight", 800)
    .attr("fill", "#252525")
    .text("Physical Risk");

  chart.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerHeight / 2)
    .attr("y", -58)
    .attr("text-anchor", "middle")
    .attr("font-weight", 800)
    .attr("fill", "#252525")
    .text("Symbolic / Institutional Authority");

  chart.append("text")
    .attr("class", "quadrant-label")
    .attr("x", x(1.45))
    .attr("y", y(5.25))
    .text("Authority without routine collision");

  chart.append("text")
    .attr("class", "quadrant-label")
    .attr("x", x(3.2))
    .attr("y", y(1.05))
    .text("High bodily risk / lower authority");

  // Bubbles with quick "slap-on" animation
  const bubbles = chart.selectAll(".bubble")
    .data(data)
    .join("circle")
    .attr("class", "bubble")
    .attr("cx", d => x(d.risk_score))
    .attr("cy", d => y(d.authority_score))
    .attr("r", 0)
    .attr("fill", d => color(d.share_percent))
    .style("opacity", 0)
    .on("mouseenter", (event, d) => showTooltip(event, d, raceLabel, container))
    .on("mousemove", event => moveTooltip(event))
    .on("mouseleave", hideTooltip);

  bubbles
    .transition()
    .duration(120)
    .delay((d, i) => i * 55)
    .ease(d3.easeCubicOut)
    .style("opacity", 1)
    .attr("r", d => r(d.share_percent) * 1.18)
    .transition()
    .duration(180)
    .ease(d3.easeBackOut.overshoot(2.2))
    .attr("r", d => r(d.share_percent));

  // Labels fade in after the bubble animation finishes
  chart.selectAll(".bubble-label")
    .data(data)
    .join("text")
    .attr("class", "bubble-label")
    .attr("x", d => x(d.risk_score))
    .attr("y", d => y(d.authority_score) + 4)
    .style("opacity", 0)
    .text(d => d.position_group)
    .transition()
    .duration(350)
    .delay((d, i) => i * 55 + 650)
    .ease(d3.easeCubicOut)
    .style("opacity", 1);

  addLegend({
    chart,
    svg,
    innerWidth,
    lowColor,
    midColor,
    highColor,
    lowLegend,
    highLegend,
    gradientId: `${raceLabel.toLowerCase()}ShareGradient`
  });
}

function addLegend({
  chart,
  svg,
  innerWidth,
  lowColor,
  midColor,
  highColor,
  lowLegend,
  highLegend,
  gradientId
}) {
  const legendWidth = 300;

  const legend = chart.append("g")
    .attr("transform", `translate(${innerWidth - 330}, 18)`);

  const defs = svg.append("defs");

  const gradient = defs.append("linearGradient")
    .attr("id", gradientId);

  gradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", lowColor);

  gradient.append("stop")
    .attr("offset", "50%")
    .attr("stop-color", midColor);

  gradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", highColor);

  legend.append("text")
    .attr("x", 0)
    .attr("y", -12)
    .attr("fill", "#4a4a4a")
    .attr("font-size", "12px")
    .attr("font-weight", 700)
    .attr("text-anchor", "start")
    .text(lowLegend);

  legend.append("text")
    .attr("x", legendWidth)
    .attr("y", -12)
    .attr("text-anchor", "end")
    .attr("fill", "#4a4a4a")
    .attr("font-size", "12px")
    .attr("font-weight", 700)
    .text(highLegend);

  legend.append("rect")
    .attr("x", 0)
    .attr("y", 2)
    .attr("width", legendWidth)
    .attr("height", 14)
    .attr("rx", 7)
    .attr("fill", `url(#${gradientId})`);
}

function showTooltip(event, d, raceLabel, container) {
  tooltip
    .style("display", "block")
    .html(`
      <strong>${d.position_group}</strong>
      ${raceLabel} player share: ${d.share_percent.toFixed(1)}%<br>
      Physical risk: ${d.risk_level}<br>
      Authority level: ${d.authority_level}<br>
      <br>
      <strong>Risk context</strong>
      ${d.risk_description}<br>
      <br>
      <strong>Authority context</strong>
      ${d.authority_description}
    `);

  moveTooltip(event);
}

function moveTooltip(event) {
  const bounds = chartCard.node().getBoundingClientRect();

  tooltip
    .style("left", `${event.clientX - bounds.left + 16}px`)
    .style("top", `${event.clientY - bounds.top + 16}px`);
}

function hideTooltip() {
  tooltip.style("display", "none");
}