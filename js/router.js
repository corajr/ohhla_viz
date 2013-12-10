App.Router.map(function() {
  this.resource('topicGraph', function () {
    this.route('stacked');
    this.route('stacked', { path: '/stacked/:selected' });
    this.route('stream');
    this.route('stream', { path: '/stream/:selected' });
    this.route('line');
    this.route('line', { path: '/line/:selected' });
    this.route('horizon');
    this.route('horizon', { path: '/horizon/:selected' });
  });
  this.route('document', {path: '/document/:itemID'});
  this.route('topic', {path: '/topic/:topicID'});
  this.route('topicSummary');
  this.route('documents');
  this.route('about');
});

App.ApplicationRoute = Ember.Route.extend({
  events: {
    toggle: function(topic) {
        var topics = this.controllerFor('topics');
        topic.toggleProperty("isSelected");
      },
  }
});
App.IndexRoute = Ember.Route.extend({
  redirect: function() {
    var topics = this.controllerFor('topics');
    // this.controllerFor('topics').deselectAll();
    topics.select([6,13,42,48]);
    this.transitionTo('topicGraph.stacked', topics.get('selected'));
  }
});

App.DocumentRoute = Ember.Route.extend({
  model: function (params) {
    if (params.itemID) {
      var itemID = decodeURIComponent(params.itemID);
      console.log(itemID);

      var doc = getDoc(itemID);
      msgpack.download("js/topwords/" + itemID + ".msg", {}, function (data) {
        doc.set("topWords", data);
      });

      return doc;
    }
  },
  serialize: function (model) {
    return {"itemID": encodeURIComponent(model.get("itemID"))};
  }
});

App.TopicRoute = Ember.Route.extend({
  model: function (params) {
    if (params.topicID) {
      return App.topics[params.topicID];
    }
  },
  serialize: function (model) {
    return {"topicID": model.get("id")};
  }
});
App.TopicGraphRoute = Ember.Route.extend({
    model: function (params) {
        // console.log(params);
        var selections = [],
            topics = this.controllerFor('topics');

        if (params.selected) {
            selections = params.selected.split(',').map(function (d) {return parseInt(d);});
            topics.select(selections);
        }

        return topics.get('selected');          
    },
    serialize: function (model) {
      // console.log(model);
      return { selected: model ? model.getEach("id").join(",") : 'none'};
    },
    events: {
        toggle: function(topic) {
            var topics = this.controllerFor('topics');

            topic.toggleProperty('isSelected');
            this.transitionTo('topicGraph.' + this.get('graphType'), topics.get('selected'));
        },
        unpin: function() {
          App.showDocs();
        },
        hideTopic: function (topic) {
          App.set("topicToHide", topic);
          Ember.$("#hideTopic").modal();
        },
        commitHide: function() {
          var topic = App.get("topicToHide");
          topic.set("hidden", true);
          topic.set("isSelected", false);
          if (topic.get("id") == App.clickedTopic) {
              App.showDocs();
          }
        }
    }
});

App.TopicGraphIndexRoute = App.TopicGraphRoute.extend({
  redirect: function () {
    this.transitionTo('topicGraph.stacked');
  }
});

App.TopicGraphStackedRoute = App.TopicGraphRoute.extend({
  graphType: 'stacked'
});

App.TopicGraphStreamRoute = App.TopicGraphRoute.extend({
  graphType: 'stream'
});

App.TopicGraphLineRoute = App.TopicGraphRoute.extend({
  graphType: 'line'
});

App.TopicGraphHorizonRoute = App.TopicGraphRoute.extend({
  graphType: 'horizon'
});