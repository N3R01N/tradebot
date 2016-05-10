'use strict';
/*
 * RL is die browser version
 * see:
 *   https://github.com/karpathy/reinforcejs
 *   http://cs.stanford.edu/people/karpathy/reinforcejs/index.html
 *
 * d3.js für visualisierung im browser
 * see:
 *   https://d3js.org/
 *
 * werden in index.html eingebunden
 */
/*
 * LINE GRAPH PART
 */
let lineGraphFactory = (height, width, containerId, initData) => {
  const STARTDATE = new Date();
  // append svg to the given container id
  let svg = d3.select(containerId)
    .append('svg')
    .attr({
      height: height,
      width: width
    });
  //scales
  let xScale = d3.time.scale()
    .range([0, width]);
  let yScale = d3.scale.linear()
    .range([height, 0]);
  // axis
  let xAxis = d3.svg.axis()
    .scale(xScale)
    .tickSize(-height);
  let yAxis = d3.svg.axis()
    .scale(yScale)
    .ticks(4)
    .orient('right');
  //line function see: http://bl.ocks.org/mbostock/1166403
  let line = d3.svg.line()
    .interpolate('monotone')
    .x((d) => {
      return xScale(d.date);
    })
    .y((d) => {
      return yScale(d.price);
    });
  //helper function
  let getData = (price, date) => {
    return {
      price: price,
      date: date
    };
  };
  let graphData = [];
  // update graph data
  let updateData = (newData) => {
    const updateDate = new Date();
    newData.forEach((datum, idx) => {
      graphData[idx].push(getData(datum, updateDate));
    });
    xScale.domain([STARTDATE, updateDate]);
    let allPrices = graphData.reduce((prev, curr) => {
        return prev.concat(curr);
      })
      .map((d) => {
        return d.price;
      });
    yScale.domain([d3.min(allPrices), d3.max(allPrices)]);
    return graphData;
  };
  //init graph data
  let initializeData = (iData) => {
    iData.forEach((d, idx) => {
      graphData.push([]);
      svg.append('path')
        .classed('line' + idx, true)
        .classed('line', true);
    });
    updateData(initData);
  };
  // * public *
  // update the graph
  let update = (newData) => {
    let lines = updateData(newData);
    svg.select('.x.axis')
      .call(xAxis);
    svg.select('.y.axis')
      .call(yAxis);
    lines.forEach((lineData, idx) => {
      svg.select('.line' + idx)
        .datum(lineData)
        .attr('d', line);
    });
  };
  //init
  initializeData(initData);
  svg.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + height + ')')
    .call(xAxis);
  svg.append('g')
    .attr('class', 'y axis')
    .attr('transform', 'translate(' + width + ',0)')
    .call(yAxis);
  return {
    update: update
  };
};
/*
 * WEBSOCKET PART
 */
const URI = 'ws://localhost:4080';
let ws = new WebSocket(URI);
ws.onopen = (event) => {
  d3.select('#connection')
    .html('connected')
    .classed('connected', true);
  console.log('connected ', event);
};
ws.onclose = (event) => {
  d3.select('#connection')
    .html('disconnected')
    .classed('connected', false);
  console.log('disconnected ', event);
};
let graph = null;
let getBidAskPrice = (data) => {
  return [data.state[0], data.state[1]];
};
ws.onmessage = (message) => {
  let data = JSON.parse(message.data);
  if (graph === null) {
    graph = lineGraphFactory(480, 960, '#graph', getBidAskPrice(data));
  } else {
    graph.update(getBidAskPrice(data));
  }
};
ws.onerror = (error) => {
  console.log('ws error', error);
};
