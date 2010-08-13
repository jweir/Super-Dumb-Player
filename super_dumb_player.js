// Hi!
// Copyright 2010 by John Weir, john@famedriver.com
// Licensed under the MIT license.
(function() {

    window.dumb_player = {
        player_url: "super_dumb_player.swf",
        create: create,
        event: function(id, event_name, data) {
            $("#" + id).trigger(event_name, data);
            $("#" + id).trigger(event_name + "(" + id + ")", data);
        }
    };

    function loaded(player) {
        $(player.player()).css("visibility", "visible");
        return player.load(player.src).volume();
    }

    function bind_events(container, player) {
        var id = container.attr("id");

        container
        .bind("sdpPlay("+id+")", player.play)
        .bind("sdpPause("+id+")", player.pause)
        .bind("sdpSeek("+id+")",
        function(e, d) {
            player.seek(d)
        })
        .bind("sdpToggle("+id+")", player.toggle)
        .bind("sdpUpdate("+id+")", function(e, d){
            player.status = d;
        })
        .bind("sdpToggleVolume("+id+")", player.toggle_volume)
        .bind("sdpFlashLoaded("+id+")",
        function() {
            loaded(player);
        })
    }

    function create(element, file_src) {
        var container = $(element),
            player = function() {
                return container.find("object")[0];
            },
            original_state = container.clone(true),
            src = file_src;

        if(element.id+"" == ""){
            container.attr("id", $.uniqueId());
        }
        var self = {
            src: src,
            status : {},
            player: function() {
                return player()
            },
            play: function() {
                player().dumb_resume();
                return self
            },
            pause: function() {
                player().dumb_pause();
                return self
            },
            seek: function(time) {
                player().dumb_seek(time);
                return self
            },
            volume: function(value) {
                return player().dumb_volume(value)
            },
            load: function(src) {
                player().dumb_play(src);
                return self
            },
            reset: function() {
                $(player()).replaceWith(original_state);
            },
            toggle: function() {
                player().dumb_togglePlayPause();
                return self;
            },
            buffer_time: function(n) {
                return player().dumb_bufferTime(n);
            },
            resize: function(w, h) {
                $(player()).css({
                    width: w,
                    height: h
                }).attr({
                    width: w,
                    height: h
                });
                return self;
            },
            flash_event: function(func) {
                container.bind("sdpFlashEvent("+container.attr("id")+")",
                function(_, flashEvent) {
                    func(flashEvent);
                });
                return self;
            },
            toggle_volume: function() {
                (player().dumb_volume() > 0) ? player().dumb_volume(0) : player().dumb_volume(1);
                return self;
            }
        }

        bind_events(container, self);

        dumb_player.flash.create(container);
        dumb_player.ui.create(container);

        $(player()).css("visibility", "hidden");
        return self;
    }
})();

(function(){
    window.dumb_player.flash = {
        create : create
    };

    function temp_element(container){
        var width  = container.width(),
            height = container.height(),
            temp   = $("<div id=''/>"),
            id     = $.uniqueId();

        temp.attr("id", id);
        temp.css({width: width, height: height});
        container.empty().append(temp);

        return id;
    }

    function flashvars(container) {
        return {
            target_id        : container.attr("id"),
            volume           : container.attr("sdp_volume"),
            auto_play        : container.attr("sdp_auto_play"), // on(default), off
            stage_scale_mode : container.attr("sdp_stage_scale_mode"), // on(default), off
            width            : container.css("width"),
            height           : container.css("height"),
            buffer_time      : container.attr("sdp_buffer_time")
        }
    }

    var params = {
            allowScriptAccess: "always",
            allowFullScreen: "true"
        },
        attributes = {}

    function create(container){
        swfobject.embedSWF(
        dumb_player.player_url,
        temp_element(container), // id for the temporary element
        container.css("width"),
        container.css("height"),
        "9.0.0", null, flashvars(container), params, attributes);
    }
})();

(function() {
    // jQuery extensions
    var data_key = "super_dumb_player";

    function get_player(el) {
        return $.data(el, "super_dumb_player");
    }

    jQuery.fn.superDumbPlayer = function(src) {
        return this.each(function() {
            var e = dumb_player.create(this, src);
            $.data(this, data_key, e);
        });
    }

    var functions_with_args_map = [
        "volume",
        "seek",
        "load",
        "resize"
    ];

    var functions_without_args_map = [
        "play",
        "pause",
        "toggle"
    ];

    jQuery.fn.flash_event = function(callback) {
        return this.each(function() {
            var player = get_player(this);
            if (player) {
                player.flash_event(callback);
            }
        });
    }

    $.each(functions_with_args_map, function(i, func){
        jQuery.fn[func] = function() {
            return this.each(function() {
                var player = get_player(this);
                if (player) {
                    player[func].apply(player, arguments);
                }
            });
        }
    });

    $.each(functions_without_args_map, function(i, func){
        jQuery.fn[func] = function() {
            return this.each(function() {
                var player = get_player(this);
                if (player) {
                    player[func]();
                }
            });
        }
    });


    var counter = 0;

    jQuery.uniqueId = function() {
        return ["spd", (new Date()).getTime(), (counter += 1)].join("-")
    }

})();

(function() {

    window.dumb_player.ui = {
        create          : create,
        template        : template,
        time_formater   : time_formater
    };

    var ui_template = $("\
    <div class='dumb_player_ui'>\
      <div class='scrubber'>\
        <div class='track'>\
          <div class='buffer'>\
            <div class='thumb'/>\
          </div>\
        </div>\
      </div>\
      <button class='state'>\
        <span class='play'>Pause</span>\
        <span class='pause'>Play</span>\
      </button>\
      <button class='volume'>\
        <span class='on'>Mute</span>\
        <span class='off'>Unmute</span>\
      </button>\
      <span class='time'/>\
      <span class='duration'/>\
    </div>");

    function template(obj_or_html) {
        if (obj_or_html !== undefined) ui_template = $(obj_or_html);
        return ui_template;
    }

    var time_formater_func = function(str) {
        return parseInt(str * 10) / 10
    }

    // Overwrite this function for formating the time
    function time_formater(func) {
        if (func !== undefined) time_formater_func = func;
        return time_formater_func;
    }

    function create(container) {
        var id = container.attr("id"),
            ui = $("<div class='super_dumb_player' id='dumb_player_" + id + "'></div>"),
            player_state;

        container.append(ui_template.clone());
        dumb_player.ui.scrubber.create(id, container);

        container.find(".volume").click(function() {
            dumb_player.event(id, "sdpToggleVolume");
        });

        container.find(".state").click(function() {
            dumb_player.event(id, "sdpToggle");
        });

        container.bind("sdpState("+id+")",
        function(event, state) {
            container.find(".state").find(".play, .pause").hide();
            container.find(".state ." + (state ? "play": "pause")).show();
        });

        container.bind("sdpVolume("+id+")",
        function(event, is_on) {
            container.find(".volume").find(".on, .off").hide();
            container.find(".volume ." + (is_on ? "on": "off")).show();
        });
    }
})();

 (function() {
    window.dumb_player.ui.scrubber = {
        create: create
    }

    function create(id, container) {
        var time = container.find(".time"),
        duration = container.find(".duration"),
        buffer = container.find(".buffer"),
        track = container.find(".track"),
        thumb = container.find(".thumb"),
        scrubber = container.find(".scrubber"),
        player_state,
        is_dragging;

        thumb.draggable({
            start: function() {
                is_dragging = true;
                before_drag_state = player_state;
                dumb_player.event(id, "sdpPause")
            },
            drag: function(e, u) {
                dumb_player.event(id, "sdpSeek", 100 * (u.position.left / (track.width() - thumb.width())) + "%")
            },
            stop: function() {
                is_dragging = false;
                if (before_drag_state) dumb_player.event(id, "sdpPlay");
            },
            containment: buffer,
            scroll: false
        });

        container.bind("sdpState(" + id + ")",
        function(e, s) {
            player_state = s;
        })

        container.bind("sdpUpdate(" + id + ")",
        function(event, info) {
            time.text(dumb_player.ui.time_formater()(info.time));
            duration.text(dumb_player.ui.time_formater()(info.duration));
            buffer.css("width", info.loaded * track.width());
            if (!is_dragging) {
                thumb.css("left", (info.percentage / 100) * (track.width() - thumb.width()))
            }
        });

        return scrubber;
    }
})();
