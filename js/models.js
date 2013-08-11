App.navbarItems = [
  Ember.Object.create({"route": "topicGraph", "name": "Topic Model"}),
  Ember.Object.create({"route": "about", "name": "About"})
];

App.Document = Ember.Object.extend({
  id: "",
  title: "",
  author: "",
  type: "",
  date: new Date(),
  topics: [],
});

App.Topic = Ember.Object.extend({
  topWords: [],
  id: -1,
  prevalence: 0.0,

  stdDev: 0.0,

  prevalencePercent: Ember.computed(function () {
    return (this.get('prevalence')*100).toFixed(2) + "% of corpus";
  }).property('prevalence'),

  style: Ember.computed(function() {
    var isSelected = this.get('isSelected'),
        color = isSelected ? this.get('color') : 'lightgray';
    return "color: " + color + ";";
  }).property('color', 'isSelected'),

  coherence: 0.0,

  isSelected: false,

  color: Ember.computed(function () {
    var topicColors = Ember.get(App, 'topicColors');
    return topicColors(this.get('id'));
  }).property('App.topicColors', 'id'),

  label: function () {
    var top = this.topWords.slice(0,3);
    return top.map(function(d){ return d.text || d;}).join(", ");    
  }.property("topWords")
});