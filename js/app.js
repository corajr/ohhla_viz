window.App = Ember.Application.create({
  LOG_TRANSITIONS: true
});

App.collectionName = "Paper Machines";

App.topicColors = d3.scale.category10().domain(d3.range(10));

App.timeDomain = [new Date(1970,0,1), new Date(2012,11,31)];
App.reopen({
  hoverTopicWords: Ember.computed(function () {
    var hoverTopicID = this.get('hoverTopic'),
        hoverTopic = hoverTopicID ? App.topics[hoverTopicID] : null;
    if (hoverTopic) {
      return hoverTopic.get('topWords');
    } else {
      return [];
    }
  }).property('hoverTopic').volatile(),
  hoverTopicColor: Ember.computed(function () {
    var hoverTopicID = this.get('hoverTopic'),
        hoverTopic = hoverTopicID ? App.topics[hoverTopicID] : null;
    if (hoverTopic) {
      return hoverTopic.get('color');
    } else {
      return "#000";
    }
  }).property('hoverTopic').volatile(),
  showDocs: function (docs, topic) {
    App.set('selectedDocs', docs);
    App.set('clickedTopic', topic);
    App.set('clickedTopicLabel', App.topics[topic].get('label') + " (% of document)");
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
  if (itemID.indexOf('.') != -1) {
    itemURL = "http://jstor.org/discover/" + itemID;
    mouseover += "JSTOR";
  } else {
    itemURL = "zotero://select/" + itemID;
    mouseover += "Zotero";
  }

  itemURL = Ember.Handlebars.Utils.escapeExpression(itemURL);

  var result = '<a href="' + itemURL + '" title="' + mouseover + '">' + text + '</a>';
  return new Ember.Handlebars.SafeString(result);
}

Ember.Handlebars.registerBoundHelper('date', dateToStr);

Ember.Handlebars.registerBoundHelper('percent', ratioToStr);

Ember.Handlebars.registerBoundHelper('localItemLink', localItemLink);

Ember.Handlebars.registerBoundHelper('itemLink', itemLink);

Ember.Handlebars.registerHelper('myLinkTo', function(route) {
  route = Ember.Handlebars.get(this, route);
  arguments = [].slice.call(arguments, 1);
  arguments.unshift(route);
  return route ? linkTo.apply(this, arguments) : "";
}); 