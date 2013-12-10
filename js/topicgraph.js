App.TopicGraphParentView = Ember.D3.ChartView.extend({
  width: 'auto',
  height: 420,
  minimumWidth: 600,
  margin: {top: 15, right: 0, bottom: 90, left: 45},

  yAxisLabel: Ember.computed(function () {
    var graphType = this.get('controller.graphType');
    if (graphType == "line") {
      return "std. dev. from mean";
    } else {
      return "% of Corpus";      
    }
  }).property("controller.graphType"),
  graphType: Ember.computed(function () {
    return this.get('controller.graphType');
  }).property('controller.graphType'),
  intervalType: "year", // other options: "month" or "day"
  interval: Ember.computed(function() {
    return d3.time[this.get('intervalType')];
  }).property('intervalType'),

  timeFormat: Ember.computed(function() {
    var intervalType = this.get('intervalType'),
        format;
    if (intervalType == "year") {
      format = d3.time.format("%Y");
    } else if (intervalType == "month") {
      format = d3.time.format("%Y-%m");      
    } else {
      format = d3.time.format("%Y-%m");
    }
    return format;
  }).property('intervalType', 'interval'),

  timeTickFormat: Ember.computed(function() {
    var timeFormat = this.get('timeFormat');
    return function(d){ return timeFormat(new Date(d)); };
  }).property('timeFormat'),

  yDomain: Ember.computed(function () {
    var graphType = this.get('graphType');
    if (graphType == 'stacked')
      return [0, 1];
    else if (graphType == 'stream')
      return [0, d3.max(this.get('streamData'), 
        function(d) { return d3.max(d, function(d) { return d.y0 + d.y; }); })];
    else if (graphType == 'line')
      return [-3, 3];
  }).property('graphType', 'streamData'),

  xScale: Ember.computed(function () {
    return d3.time.scale()
      .range([0, this.get('contentWidth')]);
  }).property('interval', 'contentWidth'),

  yScale: Ember.computed(function () {
    var yDomain = this.get('yDomain');
    return d3.scale.linear()
      .domain(yDomain)
      .range([this.get('contentHeight'), 0]);
  }).property('contentHeight', 'yDomain'),

  xAxis: Ember.computed(function() {
    var height = this.get('contentHeight');
    return d3.svg.axis()
              .scale(this.get('xScale'))
              .orient("bottom")
              .tickSize(-height)
              // .tickFormat(this.get('timeTickFormat'))
             .tickSubdivide(this.get('intervalType') == "year" ? 4 : 1)
  }).property('timeTickFormat', 'intervalType', 'xScale'),

  brushXAxis: Ember.computed(function() {
      var height = this.get('brushHeight');
      return d3.svg.axis()
                .scale(this.get('brushX'))
                .orient("bottom")
                .tickFormat(this.get('timeTickFormat'))
                .tickSize(-height)
                .tickSubdivide(this.get('intervalType') == "year" ? 4 : 1)
  }).property('brushX', 'brushHeight'),

  brushYAxis: Ember.computed(function() {
      var height = this.get('brushHeight');
      return d3.svg.axis()
                .scale(this.get('brushY'))
                .orient("left")
                .ticks(1);
  }).property('brushY', 'brushHeight'),

  yAxis: Ember.computed(function() {
    var width = this.get('contentWidth'),
        graphType = this.get('graphType');
    if (graphType == 'stacked') {
      return d3.svg.axis()
        .scale(this.get('yScale'))
        .orient("left")
        .tickSize(-width)
        .tickFormat(d3.format("%"))
        // .tickSubdivide(1)
        .ticks(5);
    } else if (graphType == 'line') {
      return d3.svg.axis()
        .scale(this.get('yScale'))
        .orient("left")
        .tickSize(-width)
        // .tickSubdivide(1)
        .ticks(5);
    } else { // give a blank axis
      return d3.svg.axis()
        .scale();
    }
  }).property('yScale', 'contentWidth', 'offset'),


  gradientScale: Ember.computed(function () {
    var docCounts = this.get('docCounts');
    // console.log(d3.max(docCounts));
    return d3.scale.pow()
      .exponent(0.1)
      .clamp(true)
      .domain([0, docCounts ? d3.max(docCounts) : 0])
      .range([1,0]);
  }).property('docCounts'),

  createGroups: function () {
    var vis = this.get('vis'),
        defs = this.get('defs'),
        width = this.get('contentWidth'),
        height = this.get('contentHeight');
               
    vis.selectAll("*").remove();
    if (vis.selectAll(".group").empty()) {
      defs.append("clipPath")
       .attr("id","plot-region")
       .append("rect")
       .attr("width", width)
       .attr("height", height);
      this.set('graphGroup', vis.append("g")
        .attr("class", "graph group")
        .attr("clip-path", "url(#plot-region)"));
      this.set('gradientGroup', vis.append("g").attr("class", "gradient group"));
      this.set('axesGroup', vis.append("g").attr("class", "axes group"));
      this.set('contextGroup', vis.append("g")
          .attr("class", "context group")
          .attr("transform", "translate(0," + (height + 30) + ")"));

    }
  },

  stack: Ember.computed(function () {
    return d3.layout.stack()
      .offset(this.get('offset'))
      .order(this.get('order'));
  }).property("offset", "order"),

  restrictedTimeDomain: Ember.computed.alias("App.restrictedTimeDomain"),
  brushHeight: 20,
  brushX: function () {
    var width = this.get("contentWidth"),
        overallTimeDomain = App.get("overallTimeDomain");

    return d3.time.scale()
        .domain(overallTimeDomain)
        .range([0, width]);
  }.property("App.overallTimeDomain", "contentWidth"),
  brushY: function () {
    var brushHeight = this.get('brushHeight'),
        docCounts = this.get("docCounts");

    return d3.scale.linear()
      .domain([0, d3.max(docCounts)])
      .range([brushHeight, 0])

  }.property("brushHeight", "docCounts"),
  brush: function () {
    var brushX = this.get("brushX");

    return d3.svg.brush()
      .x(brushX);
  }.property("brushX"),
  brushed: function () {
    var brush = this.get("brush"),
        brushX = this.get("brushX"),
        xScale = this.get("xScale"),
        that = this,
        updateAll = function (domain) {
          xScale.domain(domain);
          that.updateAxes();
          that.updateGraph();
          that.updateGradient();
        };

    return function () {
      var domain = brush.empty() ? brushX.domain() : brush.extent();
      App.set("restrictedTimeDomain", domain);
      updateAll(domain);
    };
  }.property("brush"),
  dateDocCounts: function () {
    var docCounts = this.get("docCounts"),
        topicIntervals = this.get("topicIntervals");
    return d3.zip(topicIntervals.mapProperty("key"), docCounts);
  }.property("topicIntervals", "docCounts"),
  renderBrushLine: function() {
    var context = this.get("contextGroup"),
        lineBrush = this.get("lineBrush"),
        brushHeight = this.get("brushHeight"),
        dateDocCounts = this.get("dateDocCounts");

    if (!context) return;

    if (context.select("path.line").empty()) {
      context.append("path")
        .datum(dateDocCounts)
        .attr("class", "line")
        .attr("d", lineBrush)
        .style("fill", "none")
        .style("stroke", "black");

      var brush = this.get("brush"),
          brushed = this.get("brushed"),
          brushXAxis = this.get("brushXAxis"),
          brushYAxis = this.get("brushYAxis");

      context.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + brushHeight +")") 
        .call(brushXAxis)

      var yAxis = context.append("g")
        .attr("class", "y axis");
        // .attr("transform", "translate(0," + brushHeight +")") 
      yAxis.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", 0 - (brushHeight / 2))
        .attr("y", -35) //margin.left / 2)
        .style("text-anchor", "middle")
        .text("# Docs");
      yAxis.call(brushYAxis)

      App.set("brush", brush);

      brush.on("brush", brushed);

      context.append("g")
        .attr("class", "x brush")
        .call(brush)
        .selectAll("rect")
          .attr("y", -6)
          .attr("height", brushHeight + 7);
    }
  },
  timeDomain: Ember.computed(function () {
    var interval = this.get('interval'),
        docsByTime = this.get('docsByTime'),
        restrictedTimeDomain = this.get('restrictedTimeDomain'),
        overallTimeDomain = App.get('overallTimeDomain');
    if (restrictedTimeDomain) {
      docsByTime.filterRange(restrictedTimeDomain);
      return restrictedTimeDomain;      
    } else if (overallTimeDomain) {
      docsByTime.filterRange(overallTimeDomain);
      return overallTimeDomain;
    } else if (docsByTime) {
      var first_doc = docsByTime.bottom(1)[0],
          last_doc = docsByTime.top(1)[0];
      var domain = [interval.floor(first_doc.date), interval.ceil(last_doc.date)];
      App.set("timeDomain", domain);
      return domain;
    } else {
      return [new Date(), new Date()];
    }
  }).property('interval', 'docsByTime', 'App.overallTimeDomain', 'App.restrictedTimeDomain'),

  interpolateType: 'monotone',
  offset: Ember.computed(function () {
    var graphType = this.get('graphType');
    return graphType == 'stacked' ? 'zero' : 'wiggle';
  }).property('graphType'),

  order: 'default',

  area: Ember.computed(function () {
    var x = this.get('xScale'),
        y = this.get('yScale'),
        interpolateType = this.get('interpolateType');

    return d3.svg.area()
      .interpolate(interpolateType)
      .x(function(d) { return x(d.x); })
      .y0(function(d) { return y(d.y0); })
      .y1(function(d) { return y(d.y0 + d.y); });
  }).property('xScale', 'yScale', 'interpolateType'),

  line: Ember.computed(function () {
    var x = this.get('xScale'),
        y = this.get('yScale'),
        interpolateType = this.get('interpolateType');
    return d3.svg.line()
      .interpolate(interpolateType)
      .x(function(d) { return x(d.x); })
      .y(function(d) { return y(d.y); });
  }).property('xScale', 'yScale', 'interpolateType'),

  lineBrush: Ember.computed(function () {
    var brushX = this.get('brushX'),
        brushY = this.get('brushY');

    return d3.svg.line()
      // .interpolate(interpolateType)
      .x(function(d) { return brushX(d[0]); })
      .y(function(d) { return brushY(d[1]); });
  }).property('brushX', 'brushY'),

  docsByTime: function() {
    return this.get('controller.documents.docsByTime');
  }.property('controller.documents.docsByTime'),

  topicIntervals: Ember.computed(function () {
    var interval = this.get('interval'),
        docsByTime = this.get('docsByTime'),
        topics_n = this.get('controller.topics.n'),
        docGroupsByInterval = docsByTime.group(function (date) { return interval.floor(date); });
    return docGroupsByInterval.reduce(reduceAdd, reduceSubtract, reduceInitial(topics_n)).all();
  }).property('interval', 'docsByTime', 'controller.topics.n'),

  topicMeans: Ember.computed(function () {
    return this.get('controller.topics.prevalences');
  }).property('topicIntervals'),

  topicStdDevs: Ember.computed(function () {
    var topicIntervals = this.get('topicIntervals'),
        topics_n = this.get('controller.topics.n'),
        topicMeans = this.get('topicMeans'),
        docCounts = this.get('docCounts');

    var topics = transpose(topicIntervals.map(function(d, i) { 
      return d.value.map(function (e) { 
        return docCounts[i] > 0 ? e / docCounts[i] : 0;
      });
    }));
    var stdDevs = topics.map(d3.sd);
    App.set('topicIntervals', topicIntervals);
    // App.set("topicMeans", topicMeans);
    // App.set("topicsByYear", topics);
    // App.set("topicStdevs", topics);

    this.get('controller.topics').set('stdDevs', stdDevs);
    this.get('controller.topics.content').forEach(function (d,i) { 
      d.set('stdDev', stdDevs[i]);
    });

    return stdDevs;
  }).property('topicIntervals', 'docCounts'),

  docCounts: Ember.computed(function () {
    var interval = this.get('interval'),
        docsByTime = this.get('docsByTime'),
        groupByInterval = docsByTime.group(function (date) { return interval.floor(date); }),
        docCounts = groupByInterval.reduceCount().all().map(function (d) { return d.value;});
    App.set('docCounts', docCounts);
    return docCounts;
  }).property('interval', 'docsByTime', 'topicIntervals'),

  activeTopics: Ember.computed(function () {
    return this.get('controller.topics.selectedIDs');
  }).property('controller.topics.selectedIDs'),

  smoothParams: {"type": "mean", "window": 3},
  smooth: function(layers) {
    var smoothParams = this.get("smoothParams"),
        type = smoothParams["type"],
        windowSize = smoothParams["window"];
    if (type) {
      for (var i = 0; i < layers.length; i++) {
        var d = layers[i],
            smoothed = [];
        for (var j = 0, n = d.length; j < n; j++) {
          var sample = [];
          for (var k = -windowSize; k <= windowSize; k++) {
            if (j+k >= 0 && j+k < n) {
              sample.push(d[j + k].y);        
            } else {
              sample.push(d[j].y);
            }
          }
          if (type == "median") {
            smoothed.push(d3.median(sample));            
          } else if (type == "mean") {
            smoothed.push(d3.mean(sample));            
          }
        }
        for (var j = 0, n = d.length; j < n; j++) {
          d[j].y = smoothed[j];
        }
      }    
    }
    return layers;
  },

  layers: Ember.computed(function () {
    var intervals = this.get('topicIntervals'),
        stdDevs = this.get('topicStdDevs'),
        means = this.get('topicMeans'),
        docCounts = this.get('docCounts'),
        topics = this.get('controller.topics'),
        topics_n = topics.get('n'),
        activeTopics = this.get('activeTopics'),
        smooth = this.get('smooth').bind(this);

    if (!activeTopics || activeTopics.length == 0) {
      return [];
    } else {
      var all_layers = new Array(topics_n),
          len = topics_n;
      while (len--) {
        all_layers[len] = intervals.map(
          function (d,i) { var y = docCounts[i] != 0 ? d.value[len] / docCounts[i] : 0,
                               topic = len;
                           return { x: d.key, topic: topic, y: y, stdDev: stdDevs[topic] > 0 ? (y - means[topic]) / stdDevs[topic] : 0 }; 
        });
      }

      all_layers = smooth(all_layers);
      return all_layers;
    }
  }).property('interval', 'controller.topics', 'controller.topics.selectedIDs', 'topicIntervals', 'docCounts', 'topicStdDevs'),

  lineLayers: Ember.computed(function () {
    var layers = this.get('layers'),
        topicMeans = this.get('topicMeans'),
        topicStdDevs = this.get('topicStdDevs');

    return layers.length > 0 ? layers.map(function (d) {
      var topic = d[0].topic;
      return d.map(function (e) {
        var new_e = $.extend({}, e);
        new_e.prevalence = e.y;
        new_e.y = topicStdDevs[topic] > 0 ? (new_e.y - topicMeans[topic]) / topicStdDevs[topic] : 0;
        return new_e;
      });
    }) : 0;   
  }).property('interval', 'controller.topics', 'controller.topics.selectedIDs', 'topicIntervals', 'docCounts', 'topicStdDevs'),

  streamData: Ember.computed(function () {
    var layers = this.get('layers'),
        stack = this.get('stack'),
        activeTopics = this.get('activeTopics'),
        activeLayers;
    activeLayers = layers.length > 0 ? layers.filter(function (_, i) { 
      return activeTopics.indexOf(i) !== -1; }) : [];
    return activeLayers.length > 0 ? stack(activeLayers) : [];
  }).property('layers', 'activeTopics'),

  lineData: Ember.computed(function () {
    var layers = this.get('lineLayers'),
        activeTopics = this.get('activeTopics'),
        activeLayers;
    activeLayers = layers.length > 0 ? layers.filter(function (_, i) { 
      return activeTopics.indexOf(i) !== -1; }) : [];
    return activeLayers;
  }).property('lineLayers', 'activeTopics'),

  updateAxes: function() {
    var xScale = this.get('xScale'),
        yScale = this.get('yScale'),
        axesGroup = this.get('axesGroup'),
        height = this.get('contentHeight');

    if (!axesGroup) return;

    axesGroup.selectAll(".axis").remove();

    axesGroup.append("svg:g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(this.get('xAxis'));

    axesGroup.append("svg:g")
      .attr("class", "y axis")
      .call(this.get('yAxis'));
  }.observes('yDomain'),


  highlightTopic: function (topic) {
    var graphGroup = this.get('graphGroup'),
        activeTopics = this.get('activeTopics'),
        filled = true,
        defaultOpacity = 1.0;

    if (activeTopics.indexOf(topic) == -1) return;
    App.set('hoverTopicID', topic);
    // legend.style("fill-opacity", function (d) { return (d.topic == topic) ? 1.0 : (d.active ? 0.7 : 0.3);})
    // for (i in graph) {
    var series = graphGroup.selectAll("path");
    series.transition().style(filled ? "fill-opacity": "stroke-opacity", function (d) {
        return (d[0].topic != topic) ? defaultOpacity * 0.3 : defaultOpacity;
    });
  },
  unhighlightTopic: function() {
    var graphGroup = this.get('graphGroup'),
        defaultOpacity = 1.0,
        filled = true;

    App.set('hoverTopicID', null);
    // return;
    // legend.style("fill-opacity", function (d) { return (d.active) ? 1.0 : 0.3;})
    // for (i in graph) {
      var series = graphGroup.selectAll("path"); //+ i.toString());
      series.transition().style(filled ? "fill-opacity" : "stroke-opacity", 1.0);
    //   if (categorical) {
    //     var bars = graphGroup.selectAll("g.bar.graph" + i.toString());
    //     bars.transition().style("fill-opacity", graph[i].defaultOpacity);
    //   }
    // }
  },
  getDocsForInterval: function(d, i) {
    var xScale = this.get('xScale'),
        graphGroup = this.get('graphGroup'),
        mouseX = d3.mouse(graphGroup[0][0])[0],
        time = xScale.invert(mouseX),
        topic = d[0].topic;

    this.getDocsForTime(time, topic);
  },
  getDocsForTime: function(time, topic) {
    var docsByTime = this.get('docsByTime'),
        interval = this.get('interval'),
        timeDomain = this.get('timeDomain');

    console.log(time, topic);
    var docs = docsByTime
      .filterRange([interval.floor(time), interval.ceil(time)])
      .top(100);

    docsByTime.filterRange(timeDomain);

    docs.sort(function (a,b) { return b.topics[topic] - a.topics[topic];});
    App.showDocs(docs, topic);
  },
  maskClouds: {},
  maskCloudsActive: false,
  updateGraph: function () {
    var color = Ember.get(App, 'topicColors'),
        area = this.get('area'),
        line = this.get('line'),
        graphGroup = this.get('graphGroup'),
        streamData = this.get('streamData'),
        lineData = this.get('lineData'),
        graphType = this.get('graphType'),
        maskCloudsActive = this.get('maskCloudsActive'),
        maskClouds = this.get('maskClouds'),
        defs = this.get('defs'),
        width = this.get('contentWidth'),
        height = this.get('contentHeight'),
        highlightTopic = this.get('highlightTopic').bind(this),
        unhighlightTopic = this.get('unhighlightTopic').bind(this),
        getDocsForInterval = this.get('getDocsForInterval').bind(this);

    if (!graphGroup) return;
    App.set("getDocsForTime", this.get("getDocsForTime").bind(this));

    if (graphType == 'stream' || graphType == 'stacked') {
      var graphSelection = graphGroup.selectAll("path")
          .data(streamData, function (d) { return d[0].topic;}); //.append("svg:g").attr("class", "graph")

      graphSelection.enter().append("svg:path")
          .attr("class", function (d) { return "area topic" + d[0].topic;})
          .style("fill", function (d,i) { return color(d[0].topic);})
          .on("mouseover", function (d) { highlightTopic(d[0].topic);})
          .on("mouseout", unhighlightTopic)
          .on("click", getDocsForInterval);

      graphSelection
          .attr("d", function(d) { return area(d);})

      var clipPaths = defs.selectAll("clipPath.topic")
        .data(streamData, function (d) { return d[0].topic;})
        .enter().append("svg:clipPath")
          .attr("id", function (d) { return "clipTopic" + d[0].topic;})
          .attr("class", "topic")
        .append("svg:path");

      clipPaths
          .attr("d", function(d) { return area(d);});

      if (maskCloudsActive) {
        d3.selectAll(".cloud").remove();
        graphSelection.each(function (d) {
          var topic = d[0].topic;
          var values = App.topics[topic].topWords.map(function (d) { return d.prob;});
          var cloudFontSize = d3.scale.linear().clamp(true).domain(d3.extent(values)).range([8,24]);

          maskClouds[topic] = new MaskCloud();
          maskClouds[topic]
            .size([width,height])
            .words(App.topics[topic].topWords.filter(function (_,i) { return i < 10;})
                .map(function(e) {
                  return {text: e.text, size: cloudFontSize(e.prob)};}
                )
              )
            .svg("<path d='"+ area(d) + "'></path>")
            .clip("#clipTopic"+topic)
            .parent(graphGroup.select("g.graph")) //path.topic" + i.toString()))
            .color(color(topic))
            .start();
        });        
      }
    } else if (graphType == 'line') {
      var graphSelection = graphGroup
        .selectAll("path")
        .data(lineData, function (d) { return d[0].topic;});      

      graphSelection.enter().append("svg:path")
          .attr("class", function (d) { return "line topic" + d[0].topic;})
          .style("stroke", function (d,i) { return color(d[0].topic);})
          .style("fill", "none")
          .on("mouseover", function (d) { highlightTopic(d[0].topic);})
          .on("mouseout", unhighlightTopic)
          .on("click", getDocsForInterval);   

      graphSelection
        .attr("d", function(d) { return line(d);})
   
    }
    graphSelection.exit().remove();
  }.observes('streamData', 'lineData'),

  lineMouse: function() {
    var graphType = this.get("graphType"),
        svg = this.get("svg"),
        vis = this.get("vis"),
        xScale = this.get("xScale"),
        yScale = this.get("yScale").bind(this),
        height = this.get("contentHeight"),
        get$ = (function (x) { return this.get(x);}).bind(this),
        set$ = (function (x, v) { return this.set(x, v);}).bind(this),
        getDocsForInterval = this.get("getDocsForInterval").bind(this),
        graphGroup = this.get("graphGroup"),
        interval = this.get('interval');
    if (!vis) return; //|| (graphType != "line" && graphType != "stacked")) return;

    // svg.on("click", function (d) {
    //   var graphGroup = get$("graphGroup"),
    //       popup = get$("popup"),
    //       x = d3.mouse(graphGroup[0][0])[0],
    //       time = interval.floor(xScale.invert(x));
    //   set$("lineFrozen", true);
    //   var inputHtml = "<div contenteditable='true'>Test</div>";
    //   vis.select("g.mouse")
    //      .append("foreignObject")
    //       .attr("width", 60)
    //       .attr("height", 20)
    //       .append("xhtml:body")
    //         .style("font", "14px 'Helvetica Neue'")
    //         .html(inputHtml);
    // });

    svg.on("mouseout", function () {
      d3.selectAll(".mouse").remove();
    });

    svg.on("mousemove", function (e) {
      var graphGroup = get$("graphGroup"),
          popup = get$("popup"),
          x = d3.mouse(graphGroup[0][0])[0],
          time = interval.floor(xScale.invert(x)),
          color = Ember.get(App, "topicColors");
      // if (get$("lineFrozen")) return;

      var gMouse = vis.selectAll("g.mouse")
        .data([x-3]);

      gMouse.enter().append("g")
        .attr("class", "mouse")
        .append("line")
          .style("stroke", "lightgray")
          .attr("y1", 0)
          .attr("y2", height);

      gMouse.attr("transform", function (d) { return "translate(" + d + ",0)";});

      gMouse.selectAll("text.year").remove();

      gMouse.append("text")
        .attr("class", "year")
        .text(time.getFullYear());

      if (graphType == "line") {
        var points = []; 
        vis.selectAll("path.line").each(function (d) {
                          var matching = d.filter(function (p) { return Math.abs(p.x - time) < 1; }),
                              y = findYatX(x, this);
                          points.push(matching[0] ? {y: y, stdDev: matching[0].y, prevalence: matching[0].prevalence, topic: d[0].topic} : {});
                        });

        var circles = gMouse.selectAll("circle.mouse")
          .data(points.filter(function (d) { return d.y; }), function (d) { return d.topic; });

        circles.enter().append("circle")
            .attr("class", "mouse")
            .attr("r", 5)
            .style("fill", function (d) { return color(d.topic);})
            .on("click", function (d) {
              console.log("clicked");
               getDocsForInterval([{topic: d.topic}]);
            });

        circles
            .attr("cy", function (d) { return d.y; });

      } else if (graphType == "stacked") {
        var points = vis.selectAll("path.area").data()
                      .map(function (d) {
                          var matching = d.filter(function (p) { return Math.abs(p.x - time) < 1; });
                          return matching[0] ? {y: matching[0].y, stdDev: matching[0].stdDev, prevalence: matching[0].y, topic: d[0].topic} : {};
                        });

      } else if (graphType == "horizon") {
        var points = vis.selectAll("g.chartband").data()
          .map(function (d) {
              var matching = d.filter(function (p) { return Math.abs(p.x - time) < 1; });
              return matching[0] ? {y: d.y, stdDev: matching[0].stdDev, prevalence: matching[0].prevalence, topic: d[0].topic} : {};
            });
      }

      if (graphType == "line" || graphType == "stacked") {
            var t = points.filter(function(d) { return d.y;});
          t.sort(function (a,b) { return b.y - a.y;});
          t = t.map(function (d) { 
                var topic = App.topics[d.topic],
                    topic_name = topic.get("label"),
                    topic_style = topic.get("style"),
                    prevalence = (100.0*d.prevalence).toPrecision(3) + "%"
                    stdDev = d.stdDev.toFixed(3) +"&#x3c3;",
                    onclick = "App.getDocsForTime(new Date('" + time + "')," + d.topic + ")";
                return "<span style='max-width: 120px; display: inline-block; text-overflow: ellipsis; white-space: nowrap;" +
                       "overflow: hidden; " + topic_style + "' onclick='" + onclick + "'>" + topic_name + "</span>: " + prevalence + " (" +stdDev + ")"});
          // t = t.length > 0 ? ["<p>" + time.getFullYear()].concat(t) : t;
          t = t.join("<br/>");
          popup(t, 300, 10, 240,100);        
      } else {
        var seenTopics = {};
        points = points.filter(function (d) { var newTopic = !(d.topic in seenTopics); if (newTopic) seenTopics[d.topic] = true; return newTopic;});
        var bands = gMouse.selectAll("text").data(points).enter().append("text")
          .attr("y", function (d) { return d.y;})
          .style("font-size", "11px")
          .style("fill-opacity", 0.7)
          .text(function (d) { 
            var topic = App.topics[d.topic];
            if (topic) {
              var topic_name = topic.get("label"),
                  topic_style = topic.get("style"),
                  prevalence = (100.0*d.prevalence).toPrecision(2) + "%"
                  stdDev = d.stdDev.toFixed(3) +"\u03c3",
                  label = prevalence + " (" +stdDev + ")";
              return label;
            }

          });
      }
    });
  }.observes("graphType", "vis", "graphGroup"),

  popup: function () {
    var vis = this.get("vis");
    return function(info, x, y, w, h) {
      vis.selectAll(".popup_svg").remove(); 
      var g = vis.append("g")
        .attr("transform", "translate(" + x + "," + y + ")")
        .attr("class", "popup_svg")
        .style("fill-opacity", "0.8");
      g.append("foreignObject")
          .attr("width", w)
          .attr("height", h)
          .append("xhtml:body")
            .style("font", "14px 'Helvetica Neue'")
            .html(info); 
    };
  }.property("vis"),

  gradientDef: Ember.computed(function() {
    var gradientScale = this.get('gradientScale'),
        docCounts = this.get('docCounts'),
        defs = this.get('defs'),
        gradientDef;

    if (!defs || !docCounts) return;
    gradientDef = defs.selectAll("#linearGradientDensity");

    gradientDef.data([docCounts]).enter().append("svg:linearGradient")
      .attr("id", "linearGradientDensity")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%")
    .selectAll("stop").data(function (d) { return d; })
      .enter().append("svg:stop")
        .attr("offset", function (d, i) { return ((100.0 * i) / docCounts.length) + "%"; })
        .attr("stop-color", "#fff")
        .attr("stop-opacity", function (d) { return gradientScale(d); });

    return gradientDef;
  }).property('defs', 'gradientScale'),

  updateGradient: function () {
    var width = this.get('contentWidth'),
        height = this.get('contentHeight'),
        gradientDef = this.get('gradientDef'),
        gradientGroup = this.get('gradientGroup');

    if (!gradientGroup) return;

    gradientGroup.select("#density").remove();
    gradientGroup.append("rect")
      .attr("id", "density")
      .style("fill", "url(#linearGradientDensity)")
      .style("pointer-events", "none")
      .attr("width", width)
      .attr("height", height);
  }.observes('gradientDef'),

  renderContent: function () {
    this.createGroups();
    var xScale = this.get('xScale'),
        yScale = this.get('yScale');

    xScale.domain(this.get('timeDomain'));
    yScale.domain(this.get('yDomain'));

    this.updateAxes();
    this.updateGraph();
    this.updateGradient();
    this.renderBrushLine();
  },
  onResizeHandler: function () {
    this.renderContent();
  }
});

App.TopicGraphStreamView = App.TopicGraphParentView.extend({});
App.TopicGraphStackedView = App.TopicGraphParentView.extend({});
App.TopicGraphLineView = App.TopicGraphParentView.extend({});

// App.set('cloud', Ember.D3.WordCloudView.create({
//   contentBinding: "App.hoverTopicWords",
//   colorBinding: "App.hoverTopicColor"
// }));

// App.set('cloud', Ember.D3.WordPlotView.create({
//   contentBinding: "App.hoverTopicWords",
//   colorBinding: "App.hoverTopicColor"
// }));

App.TopicPrevalenceIconView = Ember.D3.ChartView.extend(Ember.ViewTargetActionSupport, {
  click: function() {
    this.triggerAction({
      action: "toggle",
      actionContext: this.get('content')
    });
  },
  width: 32,
  height: Ember.computed.alias("width"),
  size: Ember.computed.alias("width"),
  minimumWidth: Ember.computed.alias("width"),
  margin: {top: 0, right: 0, bottom: 0, left: 0},
  scale: Ember.computed(function () {
   return d3.scale.log()
    .clamp(true)
    .range([1,this.get('width')/2])
    .domain([0.005,1]);
  }),
  renderContent: function () {
    var prevalence = this.get('content.prevalence'),
        color = this.get('content.color'),
        isSelected = this.get('content.isSelected'),
        label = this.get('content.label'),
        svg = this.get('svg'),
        vis = this.get('vis'),
        width = this.get('contentWidth'),
        scale = this.get('scale'),
        onClick = this.get('click').bind(this);

    svg.attr("class", "topicBadge");
    svg.on("click", onClick);
    vis.selectAll("*").remove();
    var g = vis.append("g")
      .attr("transform", "translate(" + width/2 + "," + width/2 + ")")
    g.append("circle")
      .attr("stroke", color)
      .attr("fill", "none")
      .attr("r", scale(1));
    g.append("circle")
        .attr("class", "inner")
        .attr("fill", color)
        .attr("r", scale(prevalence))
        .append("title")
          .text("Show in graph: " + label);
  }.observes("content.color")
});