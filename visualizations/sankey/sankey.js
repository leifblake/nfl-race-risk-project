import * as d3 from "d3";
import { sankey, sankeyLinkHorizontal } from "d3-sankey";

const dataPath = "/nfl-race-risk-project/data/modern_players_clean.csv";

const raceColors = {
  "Black": "#6C8EBF",
  "White": "#E8C88F",
  "Latino": "#7FB685",
  "Asian/Pacific Islander": "#B98EA7",
  "Middle Eastern": "#D77A61",
  "N/A (Scrape Failed)": "#B8B8B8",
  "Other": "#B8B8B8"
};

const positionMeta = {
  QB: {
    label: "Quarterback",
    risk: "Lower",
    description: "Leadership-coded role associated with decision-making, visibility, and symbolic authority."
  },
  RB: {
    label: "Running Back",
    risk: "High",
    description: "High-contact role with frequent tackling, short career concerns, and bodily wear."
  },
  WR: {
    label: "Wide Receiver",
    risk: "Medium",
    description: "Open-field speed role involving high-speed collisions and athletic specialization."
  },
  DB: {
    label: "Defensive Back",
    risk: "High",
    description: "Coverage and tackling role involving speed, reaction, and collision exposure."
  },
  LB: {
    label: "Linebacker",
    risk: "High",
    description: "Central tackling role with repeated contact and high collision frequency."
  },
  OL: {
    label: "Offensive Line",
    risk: "High",
    description: "Trench role involving repeated line contact and protection responsibilities."
  },
  DL: {
    label: "Defensive Line",
    risk: "High",
    description: "Trench role involving repeated collisions, pass-rush contact, and physical force."
  },
  TE: {
    label: "Tight End",
    risk: "Medium/High",
    description: "Hybrid receiving/blocking role combining physical contact and tactical responsibility."
  }
};

const width = 1200;
const height = 760;
const margin = { top: 24, right: 24, bottom: 24, left: 24 };

const container = d3.select("#sankey");
const tooltip = d3.select("#tooltip");

const svg = container
  .append("svg")
  .attr("viewBox", [0, 0, width, height])
  .attr("width", "100%")
  .attr("height", "100%")
  .on("click", function () {
    d3.selectAll(".link")
      .classed("faded", false)
      .classed("highlighted", false);

    d3.selectAll(".node")
      .classed("faded", false);
  });

const chart = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

d3.csv(dataPath).then(raw => {
  const clean = raw
    .map(d => ({
      race: normalizeRace(d.race),
      position_group: d.position_group
    }))
    .filter(d => d.race && d.position_group)
    .filter(d => Object.keys(positionMeta).includes(d.position_group));

  const totalPlayers = clean.length;

  const grouped = d3.rollups(
    clean,
    v => v.length,
    d => d.race,
    d => d.position_group
  );

  const raceTotals = d3.rollup(clean, v => v.length, d => d.race);
  const positionTotals = d3.rollup(clean, v => v.length, d => d.position_group);

  const nodes = [];
  const nodeMap = new Map();

  function addNode(name, type, rawName) {
    if (!nodeMap.has(name)) {
      nodeMap.set(name, nodes.length);
      nodes.push({ name, type, rawName });
    }
  }

  for (const [race, positions] of grouped) {
    addNode(`Race: ${race}`, "race", race);
    for (const [position] of positions) {
      addNode(`Position: ${position}`, "position", position);
    }
  }

  const links = [];

  for (const [race, positions] of grouped) {
    for (const [position, count] of positions) {
      links.push({
        source: nodeMap.get(`Race: ${race}`),
        target: nodeMap.get(`Position: ${position}`),
        value: count,
        race,
        position,
        percentOfPosition: count / positionTotals.get(position) * 100,
        percentOfRace: count / raceTotals.get(race) * 100,
        percentOfTotal: count / totalPlayers * 100
      });
    }
  }

  const graph = sankey()
    .nodeWidth(28)
    .nodePadding(42)
    .extent([[0, 0], [innerWidth, innerHeight]])
    .nodeSort((a, b) => d3.ascending(a.name, b.name))
    ({
      nodes: nodes.map(d => ({ ...d })),
      links: links.map(d => ({ ...d }))
    });

  // 1. Links appear first
  const link = chart.append("g")
    .attr("fill", "none")
    .selectAll("path")
    .data(graph.links)
    .join("path")
    .attr("class", "link")
    .attr("d", sankeyLinkHorizontal())
    .attr("stroke", d => raceColors[d.race] || raceColors.Other)
    .attr("stroke-width", d => Math.max(1, d.width))
    .style("opacity", 0)
    .on("mouseenter", showLinkTooltip)
    .on("mousemove", moveTooltip)
    .on("mouseleave", hideTooltip)
    .on("click", function(event, d) {
      event.stopPropagation();
      highlightFlow(d);
    });

  link.each(function () {
    const path = d3.select(this);
    const totalLength = this.getTotalLength();

    path
      .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(900)
      .delay((d, i) => i * 12)
      .ease(d3.easeCubicOut)
      .style("opacity", 0.72)
      .attr("stroke-dashoffset", 0);
  });

  // Nodes
  const node = chart.append("g")
    .selectAll("g")
    .data(graph.nodes)
    .join("g")
    .attr("class", "node")
    .on("mouseenter", showNodeTooltip)
    .on("mousemove", moveTooltip)
    .on("mouseleave", hideTooltip)
    .on("click", function(event, d) {
      event.stopPropagation();
      highlightNode(d);
    });

  // 2. Bars appear second, after lines
  node.append("rect")
    .attr("x", d => d.x0)
    .attr("y", d => (d.y0 + d.y1) / 2)
    .attr("height", 0)
    .attr("width", d => d.x1 - d.x0)
    .attr("rx", 4)
    .attr("fill", d => {
      if (d.type === "race") return raceColors[d.rawName] || raceColors.Other;
      return "#7A6F65";
    })
    .style("opacity", 0)
    .transition()
    .duration(260)
    .delay(1050)
    .ease(d3.easeCubicOut)
    .style("opacity", 1)
    .attr("y", d => d.y0 - 2)
    .attr("height", d => Math.max(1, d.y1 - d.y0) + 4)
    .transition()
    .duration(180)
    .ease(d3.easeBackOut.overshoot(1.8))
    .attr("y", d => d.y0)
    .attr("height", d => Math.max(1, d.y1 - d.y0));

  // 3. Labels appear last
  node.append("text")
    .attr("x", d => d.x0 < innerWidth / 2 ? d.x1 + 12 : d.x0 - 12)
    .attr("y", d => (d.y0 + d.y1) / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", d => d.x0 < innerWidth / 2 ? "start" : "end")
    .style("opacity", 0)
    .text(d => {
      if (d.type === "race") return d.rawName;
      const meta = positionMeta[d.rawName];
      return meta ? `${d.rawName} — ${meta.label}` : d.rawName;
    })
    .transition()
    .duration(400)
    .delay(1450)
    .ease(d3.easeCubicOut)
    .style("opacity", 1);

  function showLinkTooltip(event, d) {
    const meta = positionMeta[d.position];

    tooltip
      .style("display", "block")
      .html(`
        <strong>${d.race} → ${d.position}</strong>
        Count: ${d.value} players<br>
        ${d.percentOfPosition.toFixed(1)}% of ${d.position}<br>
        ${d.percentOfRace.toFixed(1)}% of ${d.race} players<br>
        Risk level: ${meta?.risk || "Unknown"}<br>
        <br>
        ${meta?.description || ""}
      `);

    moveTooltip(event);
  }

  function showNodeTooltip(event, d) {
    if (d.type === "race") {
      const total = raceTotals.get(d.rawName) || 0;
      tooltip
        .style("display", "block")
        .html(`
          <strong>${d.rawName}</strong>
          Total: ${total} players<br>
          ${(total / totalPlayers * 100).toFixed(1)}% of dataset
        `);
    } else {
      const total = positionTotals.get(d.rawName) || 0;
      const meta = positionMeta[d.rawName];

      tooltip
        .style("display", "block")
        .html(`
          <strong>${d.rawName} — ${meta?.label || ""}</strong>
          Total: ${total} players<br>
          Risk level: ${meta?.risk || "Unknown"}<br>
          <br>
          ${meta?.description || ""}
        `);
    }

    moveTooltip(event);
  }

  function moveTooltip(event) {
    const bounds = container.node().getBoundingClientRect();

    tooltip
      .style("left", `${event.clientX - bounds.left + 16}px`)
      .style("top", `${event.clientY - bounds.top + 16}px`);
  }

  function hideTooltip() {
    tooltip.style("display", "none");
  }

  function highlightFlow(selected) {
    link
      .classed("faded", d => !(d.race === selected.race && d.position === selected.position))
      .classed("highlighted", d => d.race === selected.race && d.position === selected.position);

    node
      .classed("faded", d => !(d.rawName === selected.race || d.rawName === selected.position));
  }

  function highlightNode(selected) {
    if (selected.type === "race") {
      link
        .classed("faded", d => d.race !== selected.rawName)
        .classed("highlighted", d => d.race === selected.rawName);

      node
        .classed("faded", d => {
          if (d.rawName === selected.rawName) return false;
          return !graph.links.some(l => l.race === selected.rawName && l.position === d.rawName);
        });
    }

    if (selected.type === "position") {
      link
        .classed("faded", d => d.position !== selected.rawName)
        .classed("highlighted", d => d.position === selected.rawName);

      node
        .classed("faded", d => {
          if (d.rawName === selected.rawName) return false;
          return !graph.links.some(l => l.position === selected.rawName && l.race === d.rawName);
        });
    }
  }
});

function normalizeRace(race) {
  if (!race) return null;

  const value = race.trim();

  if (value === "Indian") return "Asian/Pacific Islander";
  if (value === "Asian") return "Asian/Pacific Islander";
  if (value === "Pacific Islander") return "Asian/Pacific Islander";
  if (value === "Latino Hispanic") return "Latino";

  return value;
}