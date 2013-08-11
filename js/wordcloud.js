Ember.D3.WordCloudView = Ember.D3.ChartView.extend({
  width: 'auto',
  height: 150,
  fontSizePixels: [10,32],
  fontSize: Ember.computed(function() {
    return d3.scale.log().range(this.get('fontSizePixels'));
  }).property('content', 'fontSizePixels'),
  color: "#000",
  draw: Ember.computed(function () {
    var width = this.get('contentWidth'),
        height = this.get('contentHeight'),
        vis = this.get('vis'),
        color = this.get('color');

    return function(words) {
      vis.selectAll("g").remove();
      var drawn = vis.append("g")
        .attr("transform", "translate(" + width/2 + "," + height/2 + ")")
        .selectAll("text")
          .data(words)
        .enter().append("g")
          .attr("transform", function(d) {
            return "translate(" + [d.x, d.y] +")rotate(" + d.rotate + ")";
          });

      drawn
        .append("text")
        .style("font-size", function(d) { return d.size + "px"; })
        .attr("text-anchor", "middle")
        .style("fill", color)
        .text(function(d) { return d.text; });

      // drawn
        // .append("svg:title").text(function (d) { return word_hash[d.text];});
    };
  }).property('vis', 'color'),
  renderContent: function () { // takes in
    var word_data = this.get('content'),
        width = this.get('contentWidth'),
        height = this.get('contentHeight'),
        fontSize = this.get('fontSize'),
        draw = this.get('draw');

    if (!word_data) return;
    var values = [];
    word_data.forEach(function (d) {
      d.value = +d.prob;
      values.push(d.value);
    });

    fontSize.domain(d3.extent(values));

    d3.layout.cloud().size([width, height])
      .words(word_data)
      .timeInterval(10)
      .rotate(0) //function() { return ~~(Math.random() * 2) * 90; })
      .fontSize(function(d) { return fontSize(+d.value); })
      .on("end", draw)
      .start();
  }.observes('content')
});