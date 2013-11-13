App.TopicGraphHorizonView = Ember.D3.ChartView.extend({
    renderContent: function () {
        var vis = this.get('vis');
        vis.append("text").text('blah');
    }
});
