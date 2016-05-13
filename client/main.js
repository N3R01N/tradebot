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
let lineGraphFactory = (title, dimensions, containerId, initData) => {
  // start date for the time scale of the graph.
  const STARTDATE = new Date();

  let margin = {top: 20, right: 20, bottom: 30, left: 50};

  let width = dimensions[0] - margin.left - margin.right;
  let height = dimensions[1] - margin.top - margin.bottom;

  let color = d3.scale.category10();
  // append svg to the given container id
  let container = d3.select(containerId)
    .append('div')
    .classed('graphcontainer', true);
  container.append('h3').html(title);
  let svg = container.append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
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
    .orient('left');
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
        .classed('line', true)
        .classed('line' + idx, true)
        .attr({
          stroke: (data) => {
            return color(idx);
          }
        });
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
let getBidAskPrice = (data) => {
  return [data.state[0], data.state[1]];
};
let getBidAskVolume = (data) => {
  return [data.state[2], data.state[3]];
};
// this is where the magic happens
let graph = null;
let volumeGraph = null;
let rewardGraph = null;
ws.onmessage = (message) => {
  /* world snap-shot :
   [
    currentBidPrice,
    currentAskPrice,
    currentBidVolume,
    currentAskVolume,
    changeBidPrice,
    changeAskPrice,
    changeBidVolume,
    changeAskVolume
  ]
  */
  let data = JSON.parse(message.data);
  if (graph === null) {
    // lineGraphFactory function takes a title, dimensions[width, height], containerId, data[datum1, datum1, datumN,...]
    // returns a graph Object with a single method update which takes a data array like: data[datum1, datum1, datumN,...]
    // example price graph
    graph = lineGraphFactory('Price Graph', [560, 240], '#graph', getBidAskPrice(data));
    // example volume graph
    volumeGraph = lineGraphFactory('Volume Graph',[560, 240], '#graph', getBidAskVolume(data));
    // example reward graph (notice also only one line/datapoint possible)
    rewardGraph = lineGraphFactory('Reward Graph',[560, 120], '#graph', [data.reward]);
  } else {
    graph.update(getBidAskPrice(data));
    volumeGraph.update(getBidAskVolume(data));
    rewardGraph.update([data.reward]);
  }
};
ws.onerror = (error) => {
  console.log('ws error', error);
};
