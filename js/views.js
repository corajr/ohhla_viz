// views

App.NavbarItemView = Ember.View.extend({
    classNameBindings: ['isActive:active'],
    isActive: function () {
      return this.get('content.route') == App.get('currentPath').split('.')[0];
    }.property('App.currentPath'),
    context: function () {
      return this.get('content');
    }.property(),
    template: Ember.Handlebars.compile("{{#myLinkTo route}}{{name}}{{/myLinkTo}}")
});

App.NavbarItemsView = Ember.CollectionView.extend({
  content: App.navbarItems,
  tagName: 'ul',
  classNames: ['nav'],
  itemViewClass: App.NavbarItemView
});

App.DocTopicView = Ember.View.extend({
  template: Ember.Handlebars.compile("<td>{{view.content.text}}</td><td>{{percent view.content.prob}}</td>")
});

App.DocTopicHeaderView = Ember.View.extend({
  template: Ember.Handlebars.compile("<th>Topic</th><th>% of Document</th>")
});

App.DocTopicsView = Ember.CollectionView.extend({
  tagName: 'table',
  classNames: ['table'],
  content: function () {
    var topics = this.get('controller.topics');
    var topicObjs = [];
    for (var i = 0, n = topics.length; i < n; i++) {
      topicObjs.push({'text': App.topics[i].get('label'), 'prob': topics[i]});
    }
    topicObjs.sort(function (a,b) {return b.prob - a.prob;});
    return [{}].concat(topicObjs);
  }.property(),
  createChildView: function(viewClass, attrs) {
    if (attrs.content.hasOwnProperty('prob')) {
      viewClass = App.DocTopicView;      
    } else {
      viewClass = App.DocTopicHeaderView;
    }
    return this._super(viewClass, attrs);
  },
});


// App.DocCountsLineView = Ember.D3.ChartView.extend({
//   width: 'auto',
//   height: 30,
//   renderContent: function () {
//     this.createGroups();
//     var xScale = this.get('xScale'),
//         yScale = this.get('yScale');

//     xScale.domain(this.get('timeDomain'));
//     yScale.domain([0, this.get('maxY')]);

//     this.updateAxes();
//     this.updateGraph();
//     this.updateGradient();
//   },
//   onResizeHandler: function () {
//     this.renderContent();
//   }
// });

// App.set('docCountsView', App.DocCountsLineView.create());