App.ApplicationController = Ember.Controller.extend({
  needs: ['documents', 'topics'],
  topicPrevalence: function () {
    return this.get('controllers.topics.prevalences');
  }.property('controllers.topics.prevalences'),

  topicColors: Ember.computed(function () {
    var topic_ids = App.topics.getEach('id'),
        topicPrevalence = this.get('topicPrevalence');
    topic_ids.sort(function (a,b) { return topicPrevalence[b] - topicPrevalence[a];});
    return d3.scale.category20().domain(topic_ids);
  }).property('App.topics', 'topicPrevalence'),
  updatePath: function() {
    App.set("currentPath", this.currentPath);
    if (this.currentPath != "topicGraph.stacked") {
      $("#back").show();
    } else {
      $("#back").hide();
    }
    if (this.currentPath == "topicGraph.horizon") {
      App.set('horizon', true);
    } else {
      App.set('horizon', false);
    }
    // window.document.title = this.controllerFor(this.currentPath).get('title');
  }.observes('currentPath'),
});

App.DocumentsController = Ember.ArrayController.extend(EmberCrossfilter, {
  content: App.documents,
  ascending: {
    'date': true,
    'title': true,
    'author': true,
    'type': true
  },
  sortBy: function (type) {
    var asc = this.get('ascending');
    asc[type] = !asc[type];
    this.set('ascending', asc);
    console.log(type, asc[type]);
    this.sortContent(type, asc[type]);
  },
  filterMap: {
    minDate: { property: 'date', dimension: 'date', method: 'filterRangeMin'},
    maxDate: { property: 'date', dimension: 'date', method: 'filterRangeMax'},
  },
  sort: { sortProperty: 'date', isAscending: true }, 
  docsFilter: function() {
    return this.get('_crossfilter');
  }.property('content'),
  docsByTime: function() {
    return this.get('docsFilter').dimension(function (d) { return d.date;});
  }.property('docsFilter')
});

App.DocumentsTableController = Ember.Table.TableController.extend({
  hasHeader: true,
  hasFooter: false,
  numFixedColumns: 0,
  numRows: 0,
  rowHeight: 30,
  fluidTable: true,
  columns: Ember.computed(function () {
    var columns, dateColumn, titleColumn, activePercentColumn, columnNames, columnSizes;
    dateColumn = Ember.Table.ColumnDefinition.create({
      columnWidth: "10%",
      headerCellName: "Date",
      getCellContent: function (row) {
        return dateToStr(row['date']);
      }
    });
    activePercentColumn = Ember.Table.ColumnDefinition.create({
      columnWidth: "30%",
      headerCellNameBinding: "App.clickedTopicLabel",
      getCellContent: function (row) {
        var topic = App.get('clickedTopicID');
        if (topic !== undefined)
          return ratioToStr(row['topics'][topic]);
        else
          return "";
      }
    });
    titleColumn = Ember.Table.ColumnDefinition.create({
      columnWidth: "60%",
      headerCellName: "Title",
      getCellContent: function (row) {
        return localItemLink(row['title'], row['itemID']);
      }
    });

    columnNames = [];
    // columnNames = ['author'];
    // columnSizes = ["20%"];
    // columnNames = ['author', 'type'];
    // columnSizes = ["20%", "10%"];
    columns = columnNames.map(function(key, index) {
      var name;
      name = key.charAt(0).toUpperCase() + key.slice(1);
      return Ember.Table.ColumnDefinition.create({
        columnWidth: columnSizes[index],
        headerCellName: name,
        getCellContent: function(row) {
          return row[key];
        }
      });
    });
    columns.unshift(dateColumn, titleColumn);
    columns.push(activePercentColumn);
    return columns;
  }).property()
});

App.documentsTable = App.DocumentsTableController.create({
  contentBinding: "App.selectedDocs",
});

App.TopicsController = Ember.ArrayController.extend({
  needs: ['documents'],
  content: App.topics,
  documents: null,
  documentsBinding: "controllers.documents",
  init: function () {
    this._super();
    var prevalences = this.get('prevalences');
    this.get('content').forEach(function (d, i) {
      d.set('prevalence', prevalences[i]);
    });
  },
  n: function() {
    var documents = this.get('documents');
    return documents.get('content')[0].topics.length;
  }.property('documents.content'),

  prevalences: function () {
    var documents = this.get('documents'),
        docsFilter = documents.get('docsFilter'),
        prevalences = docsFilter.groupAll()
          .reduce(reduceAdd, reduceSubtract,reduceInitial(this.get('n')))
          .value()
          .map(function (d) { return d / docsFilter.size(); });

    return prevalences;
  }.property('documents.docsFilter'),

  deselectAll: function () {
    this.get('content').setEach('isSelected', false);
  },

  select: function (ids) {
    var topics = this.get('content');
    topics.setEach('isSelected', false);
    ids.forEach(function (id) {
      console.log(id);
      if (id < topics.length - 1)
        topics[id].set('isSelected', true);
    });
  },
  selected: Ember.computed(function() {
    return this.get('content').filterProperty('isSelected');
  }).property('content.@each.isSelected'),

  selectedIDs: Ember.computed(function() {
    return this.get('selected').getEach('id');
  }).property('content.@each.isSelected'),

  sortProperties: ['isSelected', 'prevalence'],
  sortAscending: false
});


App.TopicGraphController = Ember.ObjectController.extend({
  needs: ['documents', 'topics'],
  graphType: "stacked",
  graphTypes: [
    Ember.Object.create({id: 'stacked', label: 'Stacked Area'}),
    Ember.Object.create({id: 'stream', label: 'Streamgraph'}),
    Ember.Object.create({id: 'line', label: 'Line Graph'}),
    Ember.Object.create({id: 'horizon', label: 'Horizon'})
  ],
  documents: null,
  topics: null,
  documentsBinding: "controllers.documents",
  topicsBinding: "controllers.topics",
  sort: function (type) {
    console.log(type);
    var topics = this.get('topics');
    topics.set('sortProperties', ['isSelected', type]);      
  },
  graphTypeName: Ember.computed(function () {
    var graphType = this.get('graphType'),
        name = "";
    if (graphType == "stacked") name = "Stacked Area";
    else if (graphType == "stream") name = "Streamgraph";
    else if (graphType == "line") name = "Line Graph";
    else if (graphType == "horizon") name = "Horizon";
    return name;
  }).property('graphType')
});

App.TopicGraphStreamController = App.TopicGraphController.extend({
  graphType: "stream"
});

App.TopicGraphStackedController = App.TopicGraphController.extend({
  graphType: "stacked"
});

App.TopicGraphLineController = App.TopicGraphController.extend({
  graphType: "line"
});

App.TopicGraphHorizonController = App.TopicGraphController.extend({
  graphType: "horizon"
});

App.TopicSummaryController = Ember.ObjectController.extend({
  needs: ['documents', 'topics'],
  documents: Ember.computed.alias("controllers.documents"),
  topics:  Ember.computed.alias("controllers.topics"),
  threshold: 0.1,
  content: Ember.computed(function () {
    var threshold = this.get('threshold');
    var graph = makeCorrelationGraph(threshold);
    return graph;
  }).property('threshold', 'topics.@each.visible')  
});

App.AutocompleteController = Ember.Controller.extend({
  searchText: null,
  searchResults: function() {
    var searchText = this.get('searchText');
    if (!searchText) { return; }
    try {
      var regex = new RegExp(searchText, 'i');
      // var results = App.topics.filter(function(topic) {
      //   var words = topic.get("topWords").mapProperty("text");
      //   return a.some(function (d) { return d.match(regex);});
      // });
      var results = App.topics.filter(function (topic) { return topic.get("label").match(regex);});
      results.sort(function (a,b) { return b.get("prevalence") - a.get("prevalence")});
      return results.slice(0,5);      
    } catch (e) {
      console.error(e.stack);
      return;
    }
  }.property('searchText'), 
});


App.SaveButtonController = Ember.Controller.extend({
  buttons: [{"text": "Save as SVG"}, 
            {"text": "Save as PDF"},
            {"text": "Save as HTML"},
            {"text": "Export CSV"}],
});

App.ConfigButtonController = Ember.Controller.extend({
  needs: ['topics'],
  topics: Ember.computed.alias("controllers.topics"),
  template: Ember.Handlebars.compile("")
});
// App.AutocompleteResultsController = Ember.ArrayController.extend({
// });

