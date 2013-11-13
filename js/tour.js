App.ApplicationView = Ember.View.extend({
    templateName: 'application',
    tour: null,
    init: function() {
        this._super();
        this.setupTour();
    },
    setupTour: function() {
        var tour;
        tour = new Tour();
        tour.addSteps([
            {
                element: "#help",
                title: "Help",
                placement: "bottom",
                content: "Welcome to Paper Machines, a tool for text analysis in the digital humanities.<br/><br/>" +
                         "Please click next for a guided tour."
            },
            {
                element: "#headline a",
                title: "The Corpus",
                content: function(){return "This is your corpus, <b>" + $("#headline").text() + "</b>. "+
                                           " You are viewing the results of <a href='http://www.scottbot.net/HIAL/?p=19113'>topic modeling</a> on this corpus.";}
            },
            {
                element: "#topics_sidebar",
                title: "Topics",
                onShown: function(tour) {
                    var selected = App.topics.filterProperty('isSelected').length;
                    if (selected == 0) {
                        App.topics.slice().sort(function (a,b) { return b.prevalence - a.prevalence; })
                             .slice(0, 5).setEach("isSelected", true);
                    }

                },
                content: function() {
                         var selected = App.topics.filterProperty('isSelected').length;
                         var str = "Topic modeling breaks down texts into patterns of co-occuring words, or &ldquo;topics.&rdquo; "+
                                   "Each topic is labeled with its top three associated words. ";
                         if (selected == 0) {
                            str += "<br/><br/>The five most prevalent topics have been highlighted for you.";
                         }
                         return str;
                     }
            },
            {
                element: "#topics_graph",
                title: "Topic Graph",
                placement: "top",
                content: "This graph shows the changing proportions of the selected topics over time. "+
                         "The vertical axis shows the percentage of the documents made up by each topic, "+ 
                         "while the horizontal axis represents time."
            },
            {
                element: "#topic_wordcloud",
                title: "Words in a Topic",
                onShown: function () {
                    var hoverID = App.topics.slice().sort(function (a,b) { return b.prevalence - a.prevalence; })[0].id;
                    App.set("hoverTopicID", hoverID);
                },
                content: "Hovering over an individual topic in the list or on the graph will display the most common words associated with that topic. " +
                         "The vertical axis shows how common each word is, from top (most common) to bottom (most rare). "+
                         "The horizontal axis shows how specific each word is to the topic, from left (most generic) to right (most specific)."
            },
            {
                element: "#topic_wordcloud",
                title: "Showing the docs",
                placement: "top",
                onShown: function () {
                    var topID = App.topics.slice().sort(function (a,b) { return b.prevalence - a.prevalence; })[0].id;
                    App.set("clickedTopic", topID);
                    var middleDate = new Date(d3.sum(App.get("timeDomain"))/2);
                },
                content: "Clicking on the topic graph in a certain year (e.g."
            }
        ]);

        App.set('tour', tour);
    },
    didInsertElement: function () {
        $(function() {
            $("#help").on("click", function () {
                var tour = App.get('tour');
                if (tour.ended()) tour.restart();
                else tour.start();
            });              
        });
    }
});