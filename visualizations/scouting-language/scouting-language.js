import * as d3 from "d3";

const width = 1120;
const height = 560;
const margin = { top: 90, right: 60, bottom: 82, left: 160 };

const data = [
  {
    category: "Intelligence",
    group: "White QBs",
    value: 1.68,
    note: "White quarterbacks received more intelligence-related descriptors on average."
  },
  {
    category: "Intelligence",
    group: "Black QBs",
    value: 0.95,
    note: "African American quarterbacks received fewer intelligence-related descriptors on average."
  },
  {
    category: "Athleticism",
    group: "White QBs",
    value: 0.34,
    note: "White quarterbacks received far fewer athleticism-related descriptors on average."
  },
  {
    category: "Athleticism",
    group: "Black QBs",
    value: 1.77,
    note: "African American quarterbacks received far more athleticism-related descriptors on average."
  },
  {
    category: "Personality",
    group: "White QBs",
    value: 1.34,
    note: "White quarterbacks received more personality and leadership-related descriptors on average."
  },
  {
    category: "Personality",
    group: "Black QBs",
    value: 0.95,
    note: "African American quarterbacks received fewer personality-related descriptors on average."
  }
];

const categories = ["Intelligence", "Athleticism", "Personality"];
const groups = ["White QBs", "Black QBs"];

const container = d3.select("#scouting-language");
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

const x = d3.scaleLinear()
  .domain([0, 2])
  .range([0, innerWidth]);

const y0 = d3.scaleBand()
  .domain(categories)
  .range([0, innerHeight])
  .paddingInner(0.28);

const y1 = d3.scaleBand()
  .domain(groups)
  .range([0, y0.bandwidth()])
  .padding(0.16);

const color = d3.scaleOrdinal()
  .domain(groups)
  .range(["#F2C57C", "#6C8EBF"]);

// Chart title inside SVG
svg.append("text")
  .attr("x", width / 2)
  .attr("y", 36)
  .attr("text-anchor", "middle")
  .attr("font-size", "26px")
  .attr("font-weight", 900)
  .attr("fill", "#252525")
  .text("Average Descriptor Concepts in QB Draft Profiles");

// Subtitle
svg.append("text")
  .attr("x", width / 2)
  .attr("y", 62)
  .attr("text-anchor", "middle")
  .attr("font-size", "14px")
  .attr("font-weight", 650)
  .attr("fill", "#6c5f55")
  .text("Higher values mean the descriptor type appeared more often in scouting language.");

// Grid
chart.append("g")
  .attr("class", "grid")
  .call(
    d3.axisTop(x)
      .ticks(5)
      .tickSize(-innerHeight)
      .tickFormat("")
  );

// X axis
chart.append("g")
  .attr("class", "axis")
  .attr("transform", `translate(0,${innerHeight})`)
  .call(d3.axisBottom(x).ticks(5));

// Y axis
chart.append("g")
  .attr("class", "axis")
  .call(d3.axisLeft(y0));

// X axis label
chart.append("text")
  .attr("x", innerWidth / 2)
  .attr("y", innerHeight + 56)
  .attr("text-anchor", "middle")
  .attr("font-size", "15px")
  .attr("font-weight", 850)
  .attr("fill", "#252525")
  .text("Average Coded Concepts per Quarterback");

// Bars with load animation
chart.selectAll(".bar")
  .data(data)
  .join("rect")
  .attr("class", "bar")
  .attr("x", 0)
  .attr("y", d => y0(d.category) + y1(d.group))
  .attr("height", y1.bandwidth())
  .attr("rx", 8)
  .attr("fill", d => color(d.group))

  // Start collapsed from the left
  .attr("width", 0)

  .on("mouseenter", showTooltip)
  .on("mousemove", moveTooltip)
  .on("mouseleave", hideTooltip)

  // Animate bars outward to their final widths
  .transition()
  .duration(900)
  .delay((d, i) => i * 90)
  .ease(d3.easeCubicOut)
  .attr("width", d => x(d.value));

// Value labels with matching animation
chart.selectAll(".value-label")
  .data(data)
  .join("text")
  .attr("class", "value-label")
  .attr("x", 8)
  .attr("y", d => y0(d.category) + y1(d.group) + y1.bandwidth() / 2 + 5)
  .style("opacity", 0)
  .text(d => d.value.toFixed(2))
  .transition()
  .duration(900)
  .delay((d, i) => i * 90 + 450)
  .ease(d3.easeCubicOut)
  .attr("x", d => x(d.value) + 8)
  .style("opacity", 1);

// Legend
const legend = svg.append("g")
  .attr("transform", `translate(${width - 150}, 23)`);

groups.forEach((group, i) => {
  const item = legend.append("g")
    .attr("transform", `translate(0, ${i * 28})`);

  item.append("rect")
    .attr("width", 18)
    .attr("height", 18)
    .attr("rx", 5)
    .attr("fill", color(group));

  item.append("text")
    .attr("class", "legend-label")
    .attr("x", 28)
    .attr("y", 14)
    .text(group);
});

function showTooltip(event, d) {
  tooltip
    .style("display", "block")
    .html(`
      <strong>${d.group} — ${d.category}</strong>
      Average coded concepts: ${d.value.toFixed(2)}<br>
      ${d.note}
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