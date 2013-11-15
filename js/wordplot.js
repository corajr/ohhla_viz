Ember.D3.WordPlotView = Ember.D3.ChartView.extend({
  width: 'auto',
  height: 150,
  color: "#000",
  margin: {top: 10, right: 10, bottom: 25, left: 10},
  labelFontSize: 12,
  fontSize: 11,
  maxWords: 10,
  xAxisLabel: "Specificity",
  yAxisLabel: "Word Rank",
  xScale: function () {
    var width = this.get('contentWidth');
    return d3.scale.linear()
      .range([0, width]);
  }.property('contentWidth'),
  yScale: function () {
    var height = this.get('contentHeight');
    return d3.scale.linear()
      .domain([0,this.get("maxWords")-1])
      .range([0, height]);
  }.property('contentHeight', 'maxWords'),
  xAxis: function() {
    return d3.svg.axis()
              .scale(this.get('xScale'))
              .orient("bottom");
  }.property('xScale'),

  yAxis: function() {
    return d3.svg.axis()
      .scale(this.get('yScale'))
      .orient("left");
  }.property('yScale'),
  renderContent: function () {
    var word_data = this.get('content'),
        svg = this.get('svg'),
        vis = this.get('vis'),
        x = this.get('xScale'),
        y = this.get('yScale'),
        xAxis = this.get('xAxis'),
        yAxis = this.get('yAxis'),
        height = this.get('contentHeight'),
        fontSize = this.get("fontSize"),
        labelFontSize = this.get("labelFontSize"),
        maxWords = this.get("maxWords"),
        color = this.get('color');

    if (!word_data || !vis) return;

    try {
      word_data = word_data.slice(0,maxWords);
      vis.selectAll("g.word").remove();    
      word_data.sort(function (a,b) { return b.prob - a.prob;});
      word_data.forEach(function (d,i) {
        d.x = Math.random();
        d.y = i;
      });

      svg.selectAll("text")
        .style("font-weight", 200)
        .style("font-size", labelFontSize);
      var word_groups = vis.selectAll("g.word")
        .data(word_data).enter().append("g")
          .attr("class", "word")
          .style("fill", color)
          .attr("transform", function (d) {
            return "translate(" + x(d.x) + "," + y(d.y) + ")";
          });

      word_groups.append("text")
        .style("text-anchor", "start")
        .style("font-size", fontSize)
        .style("font-weight", "200")
        .text(function (d) { return d.text; });
      } catch (e) { console.error(e);}
  }.observes('content')
});