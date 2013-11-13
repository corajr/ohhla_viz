$(function () {
    var defaultPopover = {
      placement: "bottom",
      html: true
    };

    var toolbarButtons = {
        "#download": {
            "title": "Save", 
            "content": function() {
                var str = "<div class='btn-group-vertical'>";
                var template = Handlebars.compile("<button type='button' class='btn btn-default'>{{text}}</button>\n");
                var buttons = [
                    ["Save as SVG", false],
                    ["Save as PDF", false],
                    ["Export CSV", false],
                ];
                buttons.forEach(function (d) { 
                    str += template({text: d[0]});
                });
                str += "</div>";

                return str;
            }
        },
        "#config": {
            "title": "Options",
            "content": function () {
                var str = "<div>Graph Type";
                return str;
            }
        },
        "#help": {
            "title": "Help",
            "content": "blah"
        }
    };

    ["#download", "#config", "#help"].forEach(function (d) {
        $(d).popover($.extend({
          title: toolbarButtons[d].title,
          content: (typeof toolbarButtons[d].content == "function") ? toolbarButtons[d].content() : toolbarButtons[d].content
        }, defaultPopover));

        $(d).on('show.bs.popover', function () {
            $(".control-icons a").not($(this)).popover("hide");
            $(this).addClass("active");
        });

        $(d).on('hidden.bs.popover', function () {
            $(this).removeClass("active");
        });
    });
});