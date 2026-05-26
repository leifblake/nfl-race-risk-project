import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const dataPath = "/nfl-race-risk-project/data/cleaned/modern_position_race_summary.csv";

const width = 1120;
const height = 560;
const margin = { top: 88, right: 60, bottom: 120, left: 110 };

const positionOrder = ["QB", "RB", "WR", "DB", "LB", "OL", "DL", "TE"];

const raceOrder = [
  "Black",
  "White",
  "Latino",
  "Asian/Pacific Islander",
  "Middle Eastern",
  "N/A (Scrape Failed)"
];

const raceDisplay = {
  "Black": "Black",
  "White": "White",
  "Latino": "Latino",
  "Asian/Pacific Islander": "Asian / PI",
  "Middle Eastern": "Middle Eastern",
  "N/A (Scrape Failed)": "Unknown"
};

const container = d3.select("#heatmap");
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
  const data = raw
    .map(d => ({
      position_group: d.position_group,
      race: normalizeRace(d.race),
      count: +d.count,
      position_total: +d.position_total,
      percent_of_position: +d.percent_of_position
    }))
    .filter(d => positionOrder.includes(d.position_group))
    .filter(d => raceOrder.includes(d.race));

  const completedData = [];

  positionOrder.forEach(position => {
    raceOrder.forEach(race => {
      const found = data.find(
        d => d.position_group === position && d.race === race
      );

      completedData.push(
        found || {
          position_group: position,
          race,
          count: 0,
          position_total: getPositionTotal(data, position),
          percent_of_position: 0
        }
      );
    });
  });

  const x = d3.scaleBand()
    .domain(raceOrder)
    .range([0, innerWidth])
    .padding(0.08);

  const y = d3.scaleBand()
    .domain(positionOrder)
    .range([0, innerHeight])
    .padding(0.08);

  const color = d3.scaleLinear()
    .domain([0, 40, 85])
    .range([
      "#F4F1EA",
      "#A8B8A1",
      "#4E6A57"
    ]);

  // Title inside chart
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 32)
    .attr("text-anchor", "middle")
    .attr("fill", "#2a2a2a")
    .attr("font-size", "24px")
    .attr("font-weight", 800)
    .style("opacity", 0)
    .text("Position Group Racial Composition")
    .transition()
    .duration(450)
    .ease(d3.easeCubicOut)
    .style("opacity", 1);

  // X labels
  chart.append("g")
    .selectAll("text")
    .data(raceOrder)
    .join("text")
    .attr("class", "tick-label")
    .attr("x", d => x(d) + x.bandwidth() / 2)
    .attr("y", innerHeight + 24)
    .attr("text-anchor", "middle")
    .style("opacity", 0)
    .text(d => raceDisplay[d] || d)
    .call(wrapText, x.bandwidth())
    .transition()
    .duration(350)
    .delay(1050)
    .ease(d3.easeCubicOut)
    .style("opacity", 1);

  // Y labels
  chart.append("g")
    .selectAll("text")
    .data(positionOrder)
    .join("text")
    .attr("class", "tick-label")
    .attr("x", -16)
    .attr("y", d => y(d) + y.bandwidth() / 2)
    .attr("text-anchor", "end")
    .attr("dominant-baseline", "middle")
    .style("opacity", 0)
    .text(d => d)
    .transition()
    .duration(350)
    .delay(1050)
    .ease(d3.easeCubicOut)
    .style("opacity", 1);

  // Cells with quick slap-on animation
  chart.selectAll(".cell")
    .data(completedData)
    .join("rect")
    .attr("class", "cell")
    .attr("x", d => x(d.race) + x.bandwidth() / 2)
    .attr("y", d => y(d.position_group) + y.bandwidth() / 2)
    .attr("width", 0)
    .attr("height", 0)
    .attr("rx", 8)
    .attr("fill", d => d.percent_of_position === 0 ? "#eee6db" : color(d.percent_of_position))
    .style("opacity", 0)
    .on("mouseenter", showTooltip)
    .on("mousemove", moveTooltip)
    .on("mouseleave", hideTooltip)
    .transition()
    .duration(120)
    .delay((d, i) => 120 + i * 18)
    .ease(d3.easeCubicOut)
    .style("opacity", 1)
    .attr("x", d => x(d.race) - 3)
    .attr("y", d => y(d.position_group) - 3)
    .attr("width", x.bandwidth() + 6)
    .attr("height", y.bandwidth() + 6)
    .transition()
    .duration(180)
    .ease(d3.easeBackOut.overshoot(1.8))
    .attr("x", d => x(d.race))
    .attr("y", d => y(d.position_group))
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth());

  // Percent text fades in after cells finish
  chart.selectAll(".cell-text")
    .data(completedData)
    .join("text")
    .attr("class", "cell-text")
    .attr("x", d => x(d.race) + x.bandwidth() / 2)
    .attr("y", d => y(d.position_group) + y.bandwidth() / 2)
    .attr("fill", d => d.percent_of_position > 45 ? "white" : "#2b2b2b")
    .style("opacity", 0)
    .text(d => {
      if (d.percent_of_position === 0) return "";
      return `${d.percent_of_position.toFixed(0)}%`;
    })
    .transition()
    .duration(350)
    .delay(1150)
    .ease(d3.easeCubicOut)
    .style("opacity", 1);

  // Axis labels
  svg.append("text")
    .attr("class", "axis-label")
    .attr("x", margin.left + innerWidth / 2)
    .attr("y", height - 32)
    .attr("text-anchor", "middle")
    .style("opacity", 0)
    .text("Inferred Race Category")
    .transition()
    .duration(350)
    .delay(1150)
    .ease(d3.easeCubicOut)
    .style("opacity", 1);

  svg.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -(margin.top + innerHeight / 2))
    .attr("y", 28)
    .attr("text-anchor", "middle")
    .style("opacity", 0)
    .text("Position Group")
    .transition()
    .duration(350)
    .delay(1150)
    .ease(d3.easeCubicOut)
    .style("opacity", 1);

  addLegend(svg, color);

  function showTooltip(event, d) {
    tooltip
      .style("display", "block")
      .html(`
        <strong>${d.position_group} — ${raceDisplay[d.race] || d.race}</strong>
        ${d.count} players<br>
        ${d.percent_of_position.toFixed(2)}% of ${d.position_group}<br>
        Position total: ${d.position_total}
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

function normalizeRace(race) {
  if (!race) return "N/A (Scrape Failed)";
  if (race === "Indian") return "Asian/Pacific Islander";
  if (race === "Asian") return "Asian/Pacific Islander";
  if (race === "Pacific Islander") return "Asian/Pacific Islander";
  if (race === "Latino Hispanic") return "Latino";
  return race;
}

function getPositionTotal(data, position) {
  const row = data.find(d => d.position_group === position);
  return row ? row.position_total : 0;
}

function addLegend(svg, color) {
  const defs = svg.append("defs");

  const gradient = defs.append("linearGradient")
    .attr("id", "heatmapGradient");

  gradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", color(0));

  gradient.append("stop")
    .attr("offset", "50%")
    .attr("stop-color", color(42.5));

  gradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", color(85));

  const legendX = width - 300;
  const legendY = 48;
  const legendWidth = 260;

  const legend = svg.append("g")
    .attr("transform", `translate(${legendX},${legendY})`)
    .style("opacity", 0);

  legend.append("text")
    .attr("class", "legend-label")
    .attr("x", 0)
    .attr("y", -10)
    .text("Lower concentration");

  legend.append("text")
    .attr("class", "legend-label")
    .attr("x", legendWidth)
    .attr("y", -10)
    .attr("text-anchor", "end")
    .text("Higher concentration");

  legend.append("rect")
    .attr("width", 0)
    .attr("height", 14)
    .attr("rx", 7)
    .attr("fill", "url(#heatmapGradient)");

  legend
    .transition()
    .duration(350)
    .delay(1200)
    .ease(d3.easeCubicOut)
    .style("opacity", 1);

  legend.select("rect")
    .transition()
    .duration(500)
    .delay(1200)
    .ease(d3.easeCubicOut)
    .attr("width", legendWidth);
}

function wrapText(textSelection, width) {
  textSelection.each(function () {
    const text = d3.select(this);
    const words = text.text().split(/\s+/).reverse();
    let word;
    let line = [];
    let lineNumber = 0;
    const lineHeight = 1.1;
    const y = text.attr("y");
    const x = text.attr("x");
    const dy = 0;

    text.text(null);

    let tspan = text.append("tspan")
      .attr("x", x)
      .attr("y", y)
      .attr("dy", `${dy}em`);

    while ((word = words.pop())) {
      line.push(word);
      tspan.text(line.join(" "));

      if (tspan.node().getComputedTextLength() > width && line.length > 1) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];

        tspan = text.append("tspan")
          .attr("x", x)
          .attr("y", y)
          .attr("dy", `${++lineNumber * lineHeight}em`)
          .text(word);
      }
    }
  });
}