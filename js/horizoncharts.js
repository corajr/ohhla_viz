d3.gm = function (x) {
    var n = x.length;
    if (n < 1) return NaN;
    if (n === 1) return x[0];
    return Math.exp(d3.mean(x.map(Math.log).filter(isFinite)));
}

function weightedGm(x, w) {
    var n = x.length;
    if (n < 1) return NaN;
    if (n === 1) return x[0];
    var log_x = x.map(Math.log);
    w = w.filter(function (d, i) { return isFinite(log_x[i]);});
    log_x = log_x.filter(isFinite);
    var total = d3.sum(w);
    return Math.exp(d3.sum(w.map(function (d, i) { return d * log_x[i]; }))/total);
}

function estimateBeta(x, w) {
    var gx = weightedGm(x, w),
        g_1x = weightedGm(x.map(function (d) { return 1-d;}), w),
        denom = 2*(1-gx-g_1x);

    return {alpha: 0.5 + (gx/denom),
            beta: 0.5 + (g_1x/denom)
    };
}

function getBetaMode(x, w) {
    var b = estimateBeta(x, w);
    return b.alpha + b.beta > 2 ? (b.alpha - 1) / (b.alpha + b.beta - 2) : 0;
}

function argmax(d) {
    var len = d.length,
        max = -Infinity,
        idx = -1;
    while (len--) {
        if (d[len] > max) {
            max = d[len];
            idx = len;
        }
    }
    return idx;
}
function smoothArray(d, type, windowSize) {
    type = type || "mean";
    windowSize = windowSize || 3;
    var smoothed = [];
    for (var j = 0, n = d.length; j < n; j++) {
        var sample = [];
        for (var k = -windowSize; k <= windowSize; k++) {
            if (j+k >= 0 && j+k < n) {
              sample.push(d[j + k]);        
            } else {
              sample.push(d[j]);
            }
        }
        if (type == "median") {
            smoothed.push(d3.median(sample));            
        } else if (type == "mean") {
            smoothed.push(d3.mean(sample));            
        }
    }
    return smoothed;
}
function smooth(layers, type, windowSize) {
    type = type || "mean";
    windowSize = windowSize || 3;
    for (var i = 0; i < layers.length; i++) {
        var d = layers[i],
            smoothed = smoothArray(d, type, windowSize);
        for (var j = 0, n = d.length; j < n; j++) {
          d[j] = smoothed[j];
        }
    }
    return layers;
}


App.TopicGraphHorizonView = App.TopicGraphParentView.extend({
    yScale: function () { return function() {}; }.property(),
    yAxisLabel: "",
    axesGroup: null,
    height: 800,
    margin: {top: 10, right: 30, bottom: 20, left: 140},

    renderContent: function () {
        var vis = this.get('vis');
        if (!vis) return;
        var n = App.topics.length,
            m = App.docCounts.length,
            yMax = -Infinity,
            rawData = this.get("layers"),            
            data = this.get("lineLayers"),
            x = this.get("xScale"),
            xAxis = this.get('xAxis'),
            width = this.get("contentWidth"),
            height = this.get("contentHeight"),
            margin = this.get("margin");
    x.domain(this.get('timeDomain'));

    var indices = d3.range(data.length);

    var getTimesAndWeights = function(topicByYear) {
        var years = topicByYear.map(function (d) { return d.x;}),
            start_date = years[0],
            end_date = years[years.length - 1],
            scaleTime = function(time) { return (time - start_date) / (end_date - start_date);},
            scaledYears = years.map(scaleTime),
            values = topicByYear.map(function (d) { return d.y;});
        return [scaledYears, values];
    };

    indices.sort(function (a,b) {
        var a_xw = getTimesAndWeights(rawData[a]),
            b_xw = getTimesAndWeights(rawData[b]),
            a_mode = getBetaMode(a_xw[0], a_xw[1]),
            b_mode = getBetaMode(b_xw[0], b_xw[1]);
        return a_mode - b_mode;
    });

    var strip_height = (height - 2) / App.topics.length;
    var topics = App.topics.mapProperty("label");

    var rectAndTextGroup = vis.append("g")
        .attr("transform", "translate(" + -margin.left + ", 0)");
    var rectGroup = rectAndTextGroup.append("g");
    var textGroup = rectAndTextGroup.append("g");

    var graphAndAxes = vis.append("g");
    var graphGroup = graphAndAxes.append("g");
    var axesGroup = graphAndAxes.append("g")
        .attr("transform", "translate(0," + height + ")");
    this.set("axesGroup", axesGroup);
    var lineGroup = vis.append("g");


    for (var i = 0; i < n; i++) {
        var idx = indices[i],
            chart = d3.horizon()
                .width(width)
                .height(strip_height -1)
                .x(function (d) { return d.x; })
                .y(function (d) { return d.y; })
                .yMax(3)
                .bands(5)
                .mode("offset")
                .interpolate("basis");

        var y = (strip_height ) * i;
        // lineGroup.append("line")
        //     .style("stroke", "white")
        //     .attr("x1", 0)
        //     .attr("x2", width + text_margin)
        //     .attr("y1", y-1)
        //     .attr("y2", y-1);

        rectGroup.append("rect")
            .attr("x", -margin.left)
            .attr("y", y)
            .attr("width", width + margin.left)
            .attr("height", strip_height)
            .style("fill", i%2 == 0 ? "white": "#eee");

        var badgeWidth = strip_height - 1;
        var badgeColor = 'lightgray';
        var badgeScale = d3.scale.log()
            .clamp(true)
            .range([1,badgeWidth/2])
            .domain([0.005,1]);

        var g = rectGroup.append("g")
          .attr("transform", "translate(" + badgeWidth/2 + "," + (badgeWidth/2 + y) + ")")

        g.append("circle")
          .attr("stroke", badgeColor)
          .attr("fill", "none")
          .attr("r", badgeScale(1));
        g.append("circle")
            .attr("class", "inner")
            .attr("fill", badgeColor)
            .attr("r", badgeScale(App.topics[idx].get('prevalence')));

        var text = topics[idx];
        if (text.length > 25) text = text.substring(0,22) + "...";
        textGroup.append("text")
            .attr("y", y+(strip_height*0.6))
            .attr("x", badgeWidth + 2)
            .style("font-family", "Helvetica Neue")
            .style("font-size", strip_height * 0.7)
            .text(text);

        graphGroup.append("g")
            .attr("transform", "translate(0," + (y) + ")")
            .data([data[idx]]).call(chart); 
    }
    var xaxisg = axesGroup.append("g")
        .attr("class", "x axis")
        .call(xAxis);
    xaxisg.selectAll(".domain").style("fill", "none");
    var ticks = xaxisg.selectAll(".tick");
    ticks.selectAll("text").style("font", "14px Helvetica Neue").style("font-weight", 200);
    ticks.selectAll("line").style("stroke", "white");
    xaxisg.selectAll("line").data(x.ticks(24), function(d) { return d; })
        .enter()
        .append("line")
        .attr("class", "minor")
        .attr("y1", 0)
        .attr("y2", height)
        .attr("x1", x)
        .attr("x2", x)
        .style("stroke", "white")
        .style("stroke-opacity", "0.45");
  },
  onResizeHandler: function () {
    this.renderContent();
  }
});