window.App = Ember.Application.create({
  LOG_TRANSITIONS: true
});

App.collectionName = "Original Hip-Hop Lyrics Archive";

App.topicColors = d3.scale.category10();
// App.timeDomain = [new Date(1820,0,0), new Date(2000,0,0)];

App.reopen({
  demoteTopicButtons: [
    Ember.Object.create({title: 'Cancel', clicked: "cancel", dismiss: 'modal', type: 'default'}),
    Ember.Object.create({title: 'Mark as junk', clicked: "tfidf", type: 'primary'}),
  ],
  clickedTopic: function () {
    var clickedTopicID = this.get('clickedTopicID');
    return clickedTopicID !== undefined ? App.topics[clickedTopicID] : null;
  }.property('clickedTopicID').volatile(),
  hoverTopic: function () {
    var hoverTopicID = this.get('hoverTopicID'),
        clickedTopic = this.get('clickedTopic'),
        hoverTopic = clickedTopic ? clickedTopic : (hoverTopicID !== undefined ? App.topics[hoverTopicID] : null);
    return hoverTopic;
  }.property('hoverTopicID', 'clickedTopic').volatile(),
  hoverTopicWords: Ember.computed(function () {
    var hoverTopic = this.get('hoverTopic');
    if (hoverTopic) {
      var ret = hoverTopic.get('topWords');
      ret.sort(function (a,b) { return b.prob - a.prob;});
      return ret;
    } else {
      return [];
    }
  }).property('hoverTopic').volatile(),
  hoverTopicColor: Ember.computed(function () {
    var hoverTopic = this.get('hoverTopic');
    if (hoverTopic  !== undefined) {
      return hoverTopic.get('color');
    } else {
      return "#FFF";
    }
  }).property('hoverTopic').volatile(),
  showDocs: function (docs, topic) {
    App.set('selectedDocs', docs);
    App.set('clickedTopicID', topic);
    App.set('clickedTopicLabel', App.topics[topic] ? App.topics[topic].get('label') + " (% of document)" : null);
  }
});

// helpers

function dateToStr(date) {
  if (date) {  
    var y = date.getFullYear().toString(), m = (date.getMonth()+1).toString(), d = date.getDate().toString();
    m = m.length == 1 ? '0' + m : m;
    d = d.length == 1 ? '0' + d : d;
    return [y, m, d].join('/');
  } else {
    return '';
  }
}

function ratioToStr(ratio) {
  return (ratio*100).toFixed(1) + "%";
}

var linkTo = Ember.Handlebars.helpers.linkTo;

function localItemLink(text, itemID) {
  text = Ember.Handlebars.Utils.escapeExpression(text);
  // TODO: double encoding?
  // var itemURL = "#/document/" + encodeURIComponent(encodeURIComponent(itemID));
  var itemURL = "#/document/" + encodeURIComponent(itemID);
  itemURL = Ember.Handlebars.Utils.escapeExpression(itemURL);
  var result = '<a href="' + itemURL + '" title="Show stats for document">' + text + '</a>';
  return new Ember.Handlebars.SafeString(result);
}

function itemLink(text, itemID) {
  text = Ember.Handlebars.Utils.escapeExpression(text);
  var itemURL, mouseover = "Open in ";
  if (typeof itemID == 'string' && itemID.indexOf('.') != -1) {
    itemURL = "http://jstor.org/discover/" + itemID;
    mouseover += "JSTOR";
  } else {
    itemURL = getDoc(itemID).get('url');
    mouseover += "OHHLA";
    // itemURL = "zotero://select/" + itemID;
    // mouseover += "Zotero";
  }

  itemURL = Ember.Handlebars.Utils.escapeExpression(itemURL);

  var result = '<a href="' + itemURL + '" target="blank" title="' + mouseover + '">' + text + '</a>';
  return new Ember.Handlebars.SafeString(result);
}

Ember.Handlebars.registerBoundHelper('date', dateToStr);

Ember.Handlebars.registerBoundHelper('percent', ratioToStr);

Ember.Handlebars.registerBoundHelper('localItemLink', localItemLink);

Ember.Handlebars.registerBoundHelper('itemLink', itemLink);

Ember.Handlebars.registerBoundHelper('topicCorrelation', function (topic1, topic2) {
  return '(r=' + App.topic_topic[topic1.get('id')][topic2.get('id')].toFixed(2) + ')';
});

Ember.Handlebars.registerHelper('myLinkTo', function(route) {
  route = Ember.Handlebars.get(this, route);
  arguments = [].slice.call(arguments, 1);
  arguments.unshift(route);
  return route ? linkTo.apply(this, arguments) : "";
}); 

function argsort(x) {
  var keys = Object.keys(x);
  keys.sort(function (a,b) { return x[b] - x[a];});
  return keys;
}

function argmax(x) {
  var max = 0, arg_max = null;
  for (var i in x) {
    if (x[i] > max) {
      max = x[i];
      arg_max = i;
    }
  }
  return arg_max;
}
