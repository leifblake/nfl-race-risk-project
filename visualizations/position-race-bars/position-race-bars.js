import * as d3 from "d3";

const dataPath = "/data/cleaned/modern_position_race_summary.csv";

const width = 1120;
const height = 600;
const margin = { top: 80, right: 210, bottom: 80, left: 82 };

const container = d3.select("#position-race-bars");
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

const positionOrder = ["QB", "RB", "WR", "DB", "LB", "OL", "DL", "TE"];

const raceOrder = [
  "Asian/Pacific Islander",
  "Black",
  "Latino",
  "Middle Eastern",
  "N/A (Scrape Failed)",
  "White"
];

const color = d3.scaleOrdinal()
  .domain(raceOrder)
  .range([
    "#B07AA1",
    "#4E79A7",
    "#59A14F",
    "#E15759",
    "#BAB0AC",
    "#F2C572"
  ]);

function cleanText(value) {
  return String(value ?? "").trim();
}

function getPercent(d) {
  const value =
    d.percent ??
    d.percentage ??
    d.share ??
    d.race_percent ??
    d.position_percent ??
    d.percent_of_position ??
    d.pct;

  return +value;
}

function getCount(d) {
  const value =
    d.count ??
    d.player_count ??
    d.players ??
    d.n ??
    d.total;

  return +value;
}

d3.csv(dataPath).then(raw => {
  console.log("First CSV row:", raw[0]);

  const data = raw.map(d => ({
    position_group: cleanText(d.position_group),
    race: cleanText(d.race),
    count: getCount(d),
    percent: getPercent(d)
  }));

  console.log("Cleaned data:", data);

  const positions = positionOrder.filter(pos =>
    data.some(d => d.position_group === pos)
  );

  const nested = positions.map(position => {
    const rows = data.filter(d => d.position_group === position);

    const values = {};

    raceOrder.forEach(race => {
      const found = rows.find(d =>
        d.race.toLowerCase() === race.toLowerCase()
      );

      values[race] = found && !Number.isNaN(found.percent) ? found.percent : 0;
      values[`${race}_count`] = found && !Number.isNaN(found.count) ? found.count : 0;
    });

    return {
      position_group: position,
      ...values
    };
  });

  console.log("Nested stacked data:", nested);

  const stacked = d3.stack()
    .keys(raceOrder)(nested);

  const x = d3.scaleBand()
    .domain(positions)
    .range([0, innerWidth])
    .padding(0.28);

  const y = d3.scaleLinear()
    .domain([0, 100])
    .range([innerHeight, 0]);

  svg.append("text")
    .attr("class", "chart-title")
    .attr("x", width / 2)
    .attr("y", 36)
    .attr("text-anchor", "middle")
    .text("Modern NFL Race Distribution by Position Group");

  chart.append("g")
    .attr("class", "grid")
    .call(
      d3.axisLeft(y)
        .ticks(5)
        .tickSize(-innerWidth)
        .tickFormat("")
    );

  chart.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x));

  chart.append("g")
    .attr("class", "axis")
    .call(
      d3.axisLeft(y)
        .ticks(5)
        .tickFormat(d => `${d}%`)
    );

  chart.append("text")
    .attr("class", "axis-label")
    .attr("x", innerWidth / 2)
    .attr("y", innerHeight + 52)
    .attr("text-anchor", "middle")
    .text("Position Group");

  chart.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerHeight / 2)
    .attr("y", -56)
    .attr("text-anchor", "middle")
    .text("Percent of Position");

  // Bars with load animation
  chart.append("g")
    .selectAll("g")
    .data(stacked)
    .join("g")
    .attr("fill", d => color(d.key))
    .selectAll("rect")
    .data(d => d.map(v => ({
      ...v,
      race: d.key,
      position_group: v.data.position_group,
      percent: v.data[d.key],
      count: v.data[`${d.key}_count`]
    })))
    .join("rect")
    .attr("class", "bar-segment")
    .attr("x", d => x(d.position_group))
    .attr("width", x.bandwidth())

    // Start each segment collapsed at the bottom of the chart
    .attr("y", innerHeight)
    .attr("height", 0)

    .on("mouseenter", showTooltip)
    .on("mousemove", moveTooltip)
    .on("mouseleave", hideTooltip)

    // Animate each stacked segment into place
    .transition()
    .duration(900)
    .delay((d, i) => i * 35)
    .ease(d3.easeCubicOut)
    .attr("y", d => y(d[1]))
    .attr("height", d => Math.max(0, y(d[0]) - y(d[1])));

  const legend = svg.append("g")
    .attr("transform", `translate(${width - margin.right + 32}, ${margin.top})`);

  legend.append("text")
    .attr("x", 0)
    .attr("y", -18)
    .attr("font-size", "16px")
    .attr("font-weight", 900)
    .attr("fill", "#252525")
    .text("Race");

  raceOrder.forEach((race, i) => {
    const item = legend.append("g")
      .attr("transform", `translate(0, ${i * 28})`);

    item.append("rect")
      .attr("width", 18)
      .attr("height", 18)
      .attr("rx", 4)
      .attr("fill", color(race));

    item.append("text")
      .attr("class", "legend-label")
      .attr("x", 28)
      .attr("y", 14)
      .text(race);
  });

  function showTooltip(event, d) {
    tooltip
      .style("display", "block")
      .html(`
        <strong>${d.position_group} — ${d.race}</strong>
        Percent of position: ${d.percent.toFixed(1)}%<br>
        Player count: ${d.count.toLocaleString()}
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