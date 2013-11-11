$(function () {
    var defaultPopover = {
      placement: "bottom",
      html: true
    };

    var downloadButtons = function() {
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
    };

    $("#download").popover($.extend({
      title: "Save",
      content: downloadButtons()
    }, defaultPopover));

    $('#download').on('show.bs.popover', function () {
        $(this).addClass("active");
    });

    $('#download').on('hidden.bs.popover', function () {
        $(this).removeClass("active");
    });

});