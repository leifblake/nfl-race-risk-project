import * as d3 from "d3";

const dataPath = "/data/manual/historical_timeline.csv";

const width = 1120;
const height = 520;
const margin = { top: 80, right: 60, bottom: 80, left: 80 };

const container = d3.select("#timeline");
const tooltip = d3.select("#tooltip");
const chartCard = d3.select(".chart-card");

const svg = container.append("svg")
  .attr("viewBox", [0, 0, width, height])
  .attr("width", "100%")
  .attr("height", "100%");

const chart = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const legend = svg.append("g")
  .attr("transform", `translate(${width - 140}, 36)`);

const legendItems = [
  { label: "Integration", color: "#4E6A57" },
  { label: "QB History", color: "#6C8EBF" },
  { label: "Super Bowl", color: "#E8C88F" },
  { label: "Coaching", color: "#B98EA7" }
];

legendItems.forEach((item, i) => {
  const row = legend.append("g")
    .attr("transform", `translate(0, ${i * 26})`);

  row.append("circle")
    .attr("r", 7)
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("fill", item.color)
    .attr("stroke", "#2a2a2a")
    .attr("stroke-width", 1);

  row.append("text")
    .attr("x", 16)
    .attr("y", 4)
    .attr("fill", "#3a3a3a")
    .attr("font-size", "13px")
    .attr("font-weight", 600)
    .text(item.label);
});

const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

const color = d3.scaleOrdinal()
  .domain(["Integration", "QB History", "Super Bowl", "Coaching"])
  .range(["#4E6A57", "#6C8EBF", "#E8C88F", "#B98EA7"]);

d3.csv(dataPath).then(data => {
  data.forEach(d => {
    d.year = +d.year;
  });

  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.year))
    .range([0, innerWidth])
    .nice();

  const y = d3.scalePoint()
    .domain(["Integration", "QB History", "Super Bowl", "Coaching"])
    .range([innerHeight, 0])
    .padding(0.6);

  chart.append("line")
    .attr("x1", 0)
    .attr("x2", 0)
    .attr("y1", innerHeight / 2)
    .attr("y2", innerHeight / 2)
    .attr("stroke", "#c9bbae")
    .attr("stroke-width", 3)
    .transition()
    .duration(750)
    .ease(d3.easeCubicOut)
    .attr("x2", innerWidth);

  chart.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  const events = chart.selectAll(".event")
    .data(data)
    .join("g")
    .attr("class", "event")
    .attr("transform", d => `translate(${x(d.year)},${y(d.category)})`)
    .on("mouseenter", showTooltip)
    .on("mousemove", moveTooltip)
    .on("mouseleave", hideTooltip);

  events.append("circle")
    .attr("r", 0)
    .attr("fill", d => color(d.category))
    .attr("stroke", "#2a2a2a")
    .attr("stroke-width", 1.4)
    .style("opacity", 0)
    .transition()
    .duration(120)
    .delay((d, i) => 450 + i * 65)
    .ease(d3.easeCubicOut)
    .style("opacity", 1)
    .attr("r", 15)
    .transition()
    .duration(180)
    .ease(d3.easeBackOut.overshoot(2.2))
    .attr("r", 12);

  events.append("text")
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("font-weight", 800)
    .style("opacity", 0)
    .text(d => d.year)
    .transition()
    .duration(350)
    .delay((d, i) => 450 + i * 65 + 650)
    .ease(d3.easeCubicOut)
    .style("opacity", 1);

  events.append("text")
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .attr("font-size", "11px")
    .attr("font-weight", 700)
    .style("opacity", 0)
    .text(d => d.short_label)
    .transition()
    .duration(350)
    .delay((d, i) => 450 + i * 65 + 650)
    .ease(d3.easeCubicOut)
    .style("opacity", 1);

  function showTooltip(event, d) {
    tooltip
      .style("display", "block")
      .html(`
        <strong>${d.year}: ${d.title}</strong>
        ${d.category}<br><br>
        ${d.description}
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

    text.text(null);

    let tspan = text.append("tspan")
      .attr("x", x)
      .attr("y", y);

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