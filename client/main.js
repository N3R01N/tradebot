'use strict';
const SOCKETURL = 'ws://localhost:4080';
const CONNECTED = 'connected';
const DISCONNECTED = 'disconnected';
//TODO this is a hack for now..
let graphFactory = () => {
  let _data = [];
  let margin = {
      top: 20,
      right: 20,
      bottom: 30,
      left: 50
    },
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;
  let x = d3.time.scale().range([0, width]).nice();
  let y = d3.scale.linear().range([height, 0]);
  let xAxis = d3.svg.axis().scale(x).orient('bottom');
  let yAxis = d3.svg.axis().scale(y).orient('left');
  let line = d3.svg.line().interpolate('basis').x((d) => {
    return x(d.date);
  }).y((d) => {
    return y(d.price);
  });

  let lowerArea = d3.svg.area()
    .interpolate('monotone')
    .x((d) => {
      return x(d.date);
    })
    .y0(height)
    .y1((d) => {
      return y(d.price);
    });

  let upperArea = d3.svg.area()
    .interpolate('monotone')
    .x((d) => {
      return x(d.date);
    })
    .y0(0)
    .y1((d) => {
      return y(d.price);
    });

  let svg = d3.select('#graphContainer').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
      .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


  let getPrice = (obj) => {
    return obj.price;
  };
  let getDate = (obj) => {
    return obj.date;
  };
  let getDataPoint = (priceObj, dateObj) => {
    return {
      price: getPrice(priceObj),
      date: getDate(dateObj)
    };
  };
  let getClose = (data) => {
    return getDataPoint(data.ethbtc.close, data);
  };
  let getBid = (data) => {
    return getDataPoint(data.ethbtc.bid, data);
  };

  let getAsk = (data) => {
    return getDataPoint(data.ethbtc.ask, data);
  };

  let getCalc = (data) => {
    return getDataPoint(data.calc, data);
  };

  let getBidAsk = (data) => {
    return getDataPoint(data.btcBidEthAsk, data);
  };


    let getAskBid = (data) => {
      return getDataPoint(data.btcAskEthBid, data);
    };

  let updateDomains = (data) => {
    let bidsAndAsks = data.map(getBid)
      .concat(data.map(getAsk))
      .concat(data.map(getCalc))
      .concat(data.map(getClose))
      .concat(data.map(getBidAsk))
      .concat(data.map(getAskBid));

    x.domain(d3.extent(data, getDate));
    y.domain(d3.extent(bidsAndAsks, getPrice));
  };

  let init = (data) => {
    console.log('init:', data);
    svg.append('g').attr('class', 'x axis').attr('transform', 'translate(0,' + height + ')').call(xAxis);
    svg.append('g').attr('class', 'y axis').call(yAxis);

    svg.append('path').datum(data.map(getAsk)).attr('d', upperArea).classed('area', true).classed('ask', true);
    svg.append('path').datum(data.map(getBid)).attr('d', lowerArea).classed('area', true).classed('bid', true);

    svg.append('path').datum(data.map(getBidAsk)).attr('d', line).classed('line', true).classed('bidask', true);
    svg.append('path').datum(data.map(getAskBid)).attr('d', line).classed('line', true).classed('askbid', true);

    svg.append('path').datum(data.map(getClose)).attr('d', line).classed('line', true).classed('actual', true);
    svg.append('path').datum(data.map(getCalc)).attr('d', line).classed('line', true).classed('suggest', true);
  };
  let doUpdate = (data) => {
    svg.selectAll('.x.axis').transition().duration(500).call(xAxis);
    svg.selectAll('.y.axis').transition().duration(500).call(yAxis);

    svg.selectAll('.area.ask').datum(data.map(getBid)).transition().duration(500).attr('d', lowerArea);
    svg.selectAll('.area.bid').datum(data.map(getAsk)).transition().duration(500).attr('d', upperArea);

    svg.selectAll('.line.bidask').datum(data.map(getBidAsk)).transition().duration(500).attr('d', line);
    svg.selectAll('.line.askbid').datum(data.map(getAskBid)).transition().duration(500).attr('d', line);

    // actual prices
    svg.selectAll('.line.actual').datum(data.map(getClose)).transition().duration(500).attr('d', line);
    svg.selectAll('.line.suggest').datum(data.map(getCalc)).transition().duration(500).attr('d', line);
  };
  let update = (newData) => {
    newData.date = new Date(newData.time);
    _data.push(newData);
    updateDomains(_data);
    if (_data.length === 1) {
      init(_data);
    } else {
      if(_data.length > 181){
        _data.shift();
      }
      doUpdate(_data);
    }
  };
  return {
    update: update
  };
};
//    ------    START WebSocket
let ws = new WebSocket(SOCKETURL);
let graph;
ws.onopen = () => {
  d3.select('#connection').html(CONNECTED).classed('connected', true);
  graph = graphFactory();
};
ws.onclose = () => {
  d3.select('#connection').html(DISCONNECTED).classed('connected', false);
};
ws.onmessage = (message) => {
  let data = JSON.parse(message.data);
  d3.select('#dataStream').html('BTC: ' + data.btceur.close.price + ' ETH: ' + data.etheur.close.price + ' Suggested: ' + data.suggest);
  graph.update(data);
};
ws.onerror = (event) => {
  d3.select('#connection').html('ERROR!');
  console.error('ERROR: ', event);
};
