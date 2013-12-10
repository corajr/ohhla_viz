Ember.D3.NetworkView = Ember.D3.ChartView.extend({
  width: 'auto',
  height: 700,
  scale: Ember.computed(function () {
    return d3.scale.log().domain([0.01,1]).clamp(true).range([15,80]);
  }).property('content'),
  renderContent: function () {
    var graph = this.get('content'),
        width = this.get('contentWidth'),
        height = this.get('contentHeight'),
        vis = this.get('vis'),
        scale = this.get('scale'),
        color = d3.scale.category10();
    console.log(graph);

    if (!graph) return;
    var force = d3.layout.force()
      .charge(-400)
      .linkDistance(100)
      .size([width, height]);

    force
      .nodes(graph.nodes)
      .links(graph.links)
      .start();

    vis.selectAll("*").remove();
    var link = vis.selectAll(".link")
        .data(graph.links)
      .enter().append("line")
        .attr("class", "link")
        .style("stroke-width", function(d) { return Math.sqrt(d.value); });

    var node = vis.selectAll(".node")
        .data(graph.nodes)
      .enter().append("g")
        .attr("class", "node")
        .on("click", function (d) { window.location.hash="#/topic/" + d.id;})
        .on("contextmenu", function (d) { d3.event.preventDefault(); console.log(d.id); App.topics[d.id].set("visible", false);})
        .call(force.drag);


    node.append("circle")
      .attr("r", function (d) { return scale(App.topics[d.id].get('prevalence'));})
      .style("fill", "#99a"); // function(d) { return color(d.group); });

    node.append("title")
        .text(function(d) { return d.id + ": " + d.name; });

    var foreign = node.append("foreignObject")
        .attr("width", function (d) { return scale(App.topics[d.id].get('prevalence')) * 2})
        .attr("height", function (d) { return scale(App.topics[d.id].get('prevalence')) * 2;})
    foreign
      .append("xhtml:body")
        .style("background", "none")
        .style("font", "10px 'Helvetica Neue'")
        .style("fill", "#000")
        .style("overflow", "visible")
        .style("text-align", "center")
        .style("margin", "0px auto")
        .style("padding", "1em")
        .html(function(d) { return "<div>" + d.name + "</div>"; });
    foreign.attr("transform", function () {
        var bbox = this.getBBox();
        return "translate(" + [-bbox.width/2, -bbox.height/2 ] + ")";
      });

    force.on("tick", function() {
      link.attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });

      node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })

      // node.attr("cx", function(d) { return d.x; })
          // .attr("cy", function(d) { return d.y; });
    });
  }.observes('content')
});