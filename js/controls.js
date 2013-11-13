$(function () {
    var defaultPopover = {
      placement: "bottom",
      trigger: "hover",
      delay: {show: 100, hide: 1000},
      html: true
    };

    var toolbarButtons = {
        "#save": "Save",
        "#config": "Options",
        "#help": "Help"
    };
    ["#save", "#config"].forEach(function (d) { //"#help"
        $(d).popover($.extend({
          title: toolbarButtons[d],
          content: $(d+"Button").html(),
          container: d
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