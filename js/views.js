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
      // <ul>
      // {{#each topic in controller }}
        // <li {{bindAttr class=topic.isSelected}}
        //     {{action toggle topic}}>
        //   {{view App.TopicPrevalenceIconView contentBinding="topic"}}
        //   <div class="topicName">{{topic.abbreviatedLabel}}</div>
        //   <div class="topicPercentage">{{topic.prevalencePercent}} of corpus</div>
        // </li>
      // {{/each}}
      // </ul>

App.TopicBoxView = Ember.View.extend(Ember.ViewTargetActionSupport, {
    classNames: ['topicBox'],
    size: 32,
    mouseEnter: function() { App.set('hoverTopicID', this.get('content.id'));},
    mouseLeave: function() { App.set('hoverTopicID', null);},
    goToLabel: function () { return "Go to topic: " +this.get('content.label')}.property('content'),
    tagName: 'div',
    classNameBindings: ['content.isSelected', 'content.hidden'],
    templateName: "topicBox"
});

App.TopicsInnerView = Ember.CollectionView.extend({
  tagName: 'ul',
  itemViewClass: App.TopicBoxView.extend({tagName: 'li'
  })
});

App.DocTopicView = Ember.View.extend({
  templateName: "docTopic"
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
    // var colors = d3.scale.category20().domain([0,1,2,3,4,6,5,7,8,9,10,11,12,13,14,15,16,17,18,19]);
    // var topic_idxs = d3.range(topics.length);
    // topic_idxs.sort(function (a,b) { return topics[b] - topics[a];});

    for (var i = 0, n = topics.length; i < n; i++) {
      // var idx = topic_idxs[i];
      var style = App.topics[i].get('style');
      // var style = 'color: ' + colors(i);
      topicObjs.push({'text': App.topics[i].get('label'), 'style': style, 'origTopic': App.topics[i], 'prob': topics[i]});
    }
    this.set('controller.colors', App.topicColors);
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

App.TopicView = Ember.View.extend({
  contentDidChange: function () {
    // App.set('selectedDocs', []);
    var topic = this.get('controller.id'),
        docs = App.documents;
    // console.log(topic);
    docs.sort(function (a,b) { return b.topics[topic] - a.topics[topic];});
    // this.set('controller.documentsForTopic', docs);
    console.log(docs[0]);
    App.showDocs(docs, topic);
  }.observes('controller.id')
});


// cribbed from https://github.com/knownasilya/Ember-Components
window.BC = Ember.Namespace.create({
  VERSION: "0.0.1"
});

BC.RangeInput = Ember.View.extend({
  tagName: "input",
  attributeBindings: ["type", "min", "max", "step", "value", "name"],
  type: "range",
  min: 0,
  max: 10,
  step: 1,
  value: 5,
  change: function (event) {
    this.set("value", event.target.value);
  }
});

App.DocumentsForTopicView = Ember.ContainerView.extend({
  init: function() {
    this._super();
    var docs = this.get('controller.documentsForTopic');
    var tableView = Ember.Table.TableContainer.create();
    var controller = App.DocumentsTableController.create();
    controller.set('content', docs);
    tableView.set('controller', controller);
    this.pushObject(tableView);
  },
});

App.AutocompleteView = Ember.View.extend({
  templateName: 'autocomplete',
  // didInsertElement: function() {
  // }
});

App.SmallTopicBoxView = App.TopicBoxView.extend({
    tagName: 'li',
    topicText: function() { 
      var topic = this.get('content'),
          extrainfo = this.get('extrainfo');
      return topic.get("label") + (extrainfo ? " (" + this.get("extrainfo") + ")" : "");
    }.property('content'),
    template: Ember.Handlebars.compile("{{view App.TopicPrevalenceIconView contentBinding=view.content size=16}} " +
      "{{view.topicText}}")
  });
App.AutocompleteResultsView = Ember.CollectionView.extend(JQ.Animate, {
  tagName: 'ul',
  classNames: ['suggestions'],
  hide: function() {
    this.$().hide('fast');
  },
  show: function() {
    if (this.get("content") && this.get("content").length > 0) {
      this.$().show('fast');      
    } else {
      this.hide();
    }
  }.observes("content"),
  didInsertElement: function() {
    this.$().hide();
  },
  mouseLeave: function() {
    if (this.get("content").filterProperty("isSelected").length > 0) {
      this.hide();
    }
  },
  itemViewClass: App.SmallTopicBoxView.extend({
    'extrainfo': Ember.computed.alias("content.prevalencePercent")
  })
});


// .map(function (d) { return d.get("label") + " (" + d.get("prevalencePercent") + ")";})
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

