Ember.D3.WordPlotView = Ember.D3.ChartView.extend({
  width: 'auto',
  height: 150,
  color: function () {
    var color = "#000",
        colorFunc = App.get("topicColors");
    if (colorFunc) {
      color = function(d) {
        return colorFunc(d.topic);
      };
    }

    return color;
  }.property("App.topicColors"),
  margin: function () {
    var labelFontSize = this.get("labelFontSize");
    return {top: 10, right: 10, bottom: 25, left: labelFontSize};
  }.property("labelFontSize"),
  labelFontSize: 12,
  fontSize: 11,
  maxWords: 10,
  xAxisLabel: "Generality (IMI(w,D|k))",
  yAxisLabel: "Word Rank",
  xScale: function () {
    var width = this.get('contentWidth'),
        word_data = this.get('content'),
        values = word_data.length > 0 ? word_data[0].hasOwnProperty('imi') ? word_data.mapProperty('imi') : word_data.mapProperty('idf') : [0,1];
    return d3.scale.linear()
      .domain(d3.extent(values))
      .range([0, width]);
  }.property('contentWidth', 'content'),
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
        d.x = d.idf ? d.idf : (d.imi ? d.imi : Math.random());
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
        .text(function (d) { return d.text; })
        .append("title")
          .text(function (d) {
            var topicID = d.topic;
            if (topicID) {
              return d3.format(".2%")(d.prob) + " of doc; assigned to " + App.topics[topicID].get("label");
            }
          });
      } catch (e) { console.error(e);}
  }.observes('content', 'App.topicColors')
});