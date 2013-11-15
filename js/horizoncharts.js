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
    height: 500,
    margin: {top: 10, right: 10, bottom: 10, left: 10},

    renderContent: function () {
        var vis = this.get('vis');
        if (!vis) return;
        var n = App.topics.length,
            m = App.docCounts.length,
            yMax = -Infinity,
            data = this.get("lineData"),
            x = this.get("xScale"),
            xAxis = this.get('xAxis'),
            width = this.get("contentWidth"),
            height = this.get("contentHeight");
    x.domain(this.get('timeDomain'));


    data.sort(function (a,b) {
        var a_argmax = argmax(smoothArray(a, "mean", 5)),//.map(Math.abs)),
            b_argmax = argmax(smoothArray(b, "mean", 5))//.map(Math.abs));
        return a_argmax - b_argmax;
    });

    // data = data.map(function (d) { return d3.zip(d3.range(d.length), d);});
    // data = data.map(function (d) { return d3.zip(d3.range(d.length), smoothArray(d, "mean", 1));});

    var strip_height = 12;
    var topics = App.topics.mapProperty("label");

    var text_margin = 140;
    var rectGroup = vis.append("g");
    var textGroup = vis.append("g");

    var graphAndAxes = vis.append("g")
        .attr("transform", "translate(" + text_margin + ", 0)");
    var graphGroup = graphAndAxes.append("g");
    var axesGroup = graphAndAxes.append("g").attr("transform", "translate(0," + height + ")");
    this.set("axesGroup", axesGroup);
    var lineGroup = vis.append("g");


    for (var i = 0; i < n; i++) {
        var chart = d3.horizon()
            .width(width)
            .height(strip_height -1)
            .x(function (d) { return d.x; })
            .y(function (d) { return d.y; })
            .yMax(0.1)
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
            .attr("y", y)
            .attr("width", width + text_margin)
            .attr("height", strip_height)
            .style("fill", i%2 == 0 ? "white": "#eee");

        var badgeWidth = 10;
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
            .attr("r", badgeScale(App.topics[i].get('prevalence')));

        var text = topics[i];
        if (text.length > 25) text = text.substring(0,22) + "...";
        textGroup.append("text")
            .attr("y", y+8)
            .attr("x", 12)
            .style("font-family", "Helvetica Neue")
            .style("font-size", "10px")
            .text(text);

        graphGroup.append("g")
            .attr("transform", "translate(0," + (y) + ")")
            .data([data[i]]).call(chart); 
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
