$(document).ready(function() {
    dumb_player.player_url = "../super_dumb_player.swf";
    var test_player,
    default_load_time = 10000;

    // Test helper: pause until the movie is started
    function after_movie_loads(callback, times_to_call) {

        var called = 0;
        times_to_call = times_to_call || 1;

        $("body").bind("sdpUpdate(test_player)",
        function(event, data) {
            if (called < times_to_call) {
                called = called + 1;
                callback();
            }
        })
    }

    function create_player() {
        test_player = dumb_player.create("#test_player", './assets/dumb_example.m4v');
    }

    /////////////////////////////////////////////////////////////////////////////////
    (function() {

        var container;

        module("Setup", {
            setup: function(){
                container = $("#test_player");
                create_player();
            },
            teardown: function() {
                $("body").unbind();
            }
        });

        test("injects flash into the container HTML", function() {
            ok(container.find("object")[0])
        });

        test("sets the flash size to match the container's size", function() {
            equal(270, container.find("object").width())
            equal(360, container.find("object").height())
        });

        test("injects the UI into the container HTML", function(){
            ok(container.find(".dumb_player_ui")[0])
        });

        test("player() returns the flash object", function(){
            equal($("object")[0], test_player.player())
        })

        test("flash object is hidden at creation", function() {
            equal("hidden", $(test_player.player()).css("visibility"), "flash movie is hidden");
        });

        test("flash object is visible after the video file loads", function() {
            stop(default_load_time);
            expect(1);
            after_movie_loads(function() {
                equal("visible", $(test_player.player()).css("visibility"), "flash movie is visible");
                start();
            })
        });


    })();

    /////////////////////////////////////////////////////////////////////////////////
    module("Events", {
        setup: function() {
            test_player = dumb_player.create("#test_player", './assets/dumb_example.m4v');
        },
        teardown: function() {
            $("body").unbind();
        }
    });

    test("are bound to EVENT_NAME",
    function() {
        stop(default_load_time);
        $("body").bind("sdpFlashLoaded",
        function(e) {
            start();
            equal(e.target, $("#test_player")[0])
        });
    })

    test("are bound to EVENT_NAME(PLAYER_ID), where id is the player's DOM id",
    function() {
        stop(default_load_time);
        $("body").bind("sdpFlashLoaded(test_player)",
        function() {
            start();
            ok(true)
        });
    })

    test("time, duration, percentage, loaded is available via the player.status property", function(){
        stop(default_load_time);
        expect(4)
        after_movie_loads(function(){
            setTimeout(function(){
                ok(0 <= test_player.status.time, "time");
                ok(0 <= test_player.status.duration, "duration");
                ok(0 <= test_player.status.percentage, "percentage");
                ok(0 <= test_player.status.loaded, "loaded");
                start();
            }, 200)
        })
    })


    /////////////////////////////////////////////////////////////////////////////////
    module("Loading the video file", {
        setup: function() {
            test_player = dumb_player.create("#test_player", './assets/dumb_example.m4v');
        },
        teardown: function() {
            $("body").unbind();
        }
    })

    test("duration is set by the length of the loaded movie",
    function() {
        expect(1);
        stop(default_load_time);
        after_movie_loads(function() {
            equal(24, parseInt($(".duration").text()), "duration should be 24");
            start();
        });
    })

    test("sdpFlashLoaded(PLAYER_ID) is triggered when the movie is loaded",
    function() {
        stop(default_load_time);
        $("body").bind("sdpFlashLoaded(test_player)",
        function() {
            start();
            ok(true)
        });
    });

    test("sdpState(PLAYER_ID) is triggered with 'true' the movie has started or is playing",
    function() {
        stop(default_load_time);
        expect(1);
        $("body").bind("sdpState(test_player)",
        function(event, data) {
            if (data == true) {
                start();
                ok(true, "player started")
            }
        });
    });

    test("sdpUpdate(PLAYER_ID) is triggered when the movie is playing; sends time based data",
    function() {
        stop(default_load_time);
        expect(4);
        $("body").bind("sdpUpdate(test_player)",
        function(event, data) {
            start();
            equal(parseInt(data.duration), 24, "duration")
            equal(parseInt(data.time), 0, "time")
            ok(data.percentage >= 0, "what % is loaded: " + data.percentage)
            ok(data.loaded >= 0, "how much data is loaded:" + data.loaded)
        });
    })


    /////////////////////////////////////////////////////////////////////////////////
    module("Player UI", {
        setup: function() {
            test_player = dumb_player.create("#test_player", './assets/dumb_example.m4v');
        },
        teardown: function() {
            $("body").unbind();
        }
    })

    test("clicking the volume button toggles mute/umute",
    function() {
        expect(3);
        stop(default_load_time);

        after_movie_loads(function() {
            var button = $(".volume");
            ok(button.find('.off').is(":visible"), "button is in initial state");
            Syn
            .click({},
            button,
            function() {
                ok(button.find('.on').is(":visible"), "button is in correct state");
            })
            .click({},
            button,
            function() {
                ok(button.find('.off').is(":visible"), "final button state");
                start();
            })
        })
    });

    test("adusting the volume sends an event with the current volume level",
    function() {
        stop(default_load_time)
        var counter = 0,
        results = [[0.7, "on"], [0, "off"], [1, "on"]];

        expect(6);
        after_movie_loads(function() {
            $("body").bind("sdpVolume(test_player)",
            function(event, data) {
                equal(results[counter][0], data, "volume set correctly");
                ok($(".volume").find("." + results[counter][1]).is(":visible"));
                counter++;
                if (counter == 3) {
                    start()
                } else {
                    test_player.volume(results[counter][0]);
                }
            });
            test_player.volume(results[0][0]);
        })
    })

    test("clicking play button toggles play/pause",
    function() {
        expect(5);
        stop(default_load_time);
        var time_before_play,
            time_after_play;

        after_movie_loads(function() {
            var button = $(".state");
            ok(button.find('.play').is(":visible"), "button is in initial state");
            Syn
            .click({},
            button,
            function() {
                ok(button.find('.pause').is(":visible"), "button is in correct state");
                ok(test_player.status.time >= 0, "time is set set")
            })
            .click({},
            button,
            function() {
                time_before_play = test_player.status.time;
                ok(button.find('.play').is(":visible"), "final button state");
            })
            .delay(1100)
            .click({},
            button,
            function() {
                time_after_play = test_player.status.time;
                ok(time_after_play > time_before_play + 0.8, "time advanded: " + time_after_play);
                start()
            })
        })
    });

    test("dragging the the scrubber seeks the movie",
    function() {
        expect(2);
        stop(default_load_time);

        var thumb = $(".thumb"),
            time_before_drag,
            timer_after_drag;

        var test_drag = function() {
            ok(time_before_drag >= 0)

            timer_after_drag = test_player.status.time;
            ok(timer_after_drag > time_before_drag, "time is updated : " + time_before_drag + " " + timer_after_drag);
            start();
        }

        after_movie_loads(function() {
            Syn
            .click($(".state"))
            .delay(1000, function(){time_before_drag = test_player.status.time;}) // let the movie load a bit
            .drag({
                from: {
                    clientX: thumb.offset().left,
                    clientY: thumb.offset().top
                },
                to: {
                    clientX: thumb.offset().left + 250,
                    clientY: thumb.offset().top
                },
                duration: 1000
            }, thumb, test_drag)
        })
    })

    /////////////////////////////////////////////////////////////////////////////////
    module("jQuery plugin", {
        setup: function() {
            $("#test_player").superDumbPlayer('./assets/dumb_example.m4v');
        },
        teardown: function() {
            $("body").unbind();
        }
    });

    function listen_for(event_name) {
        $("body").bind(event_name,
        function(event, data) {
            ok(true, event_name + "was triggered");
            start();
        });
    }

    test("creates a flash object",
    function() {
        ok($("object")[0]);
    });

    test("stores the player in jQuery data",
    function() {
        ok($.data($("#test_player")[0], "super_dumb_player"));
        ok($.data($("#test_player")[0], "super_dumb_player").volume);
    });


    $.each({
        volume: ["sdpVolume", 0.5],
        seek:   ["sdpUpdate", 5],
        toggle: ["sdpUpdate"],
        pause:  ["sdpUpdate"],
        play:   ["sdpUpdate"]

    },
    function(m, e) {
        test("responds to " + m,
        function() {
            expect(1);
            stop(default_load_time);
            after_movie_loads(function(){
                listen_for(e[0] + "(test_player)");
                $("#test_player")[m](e[1]);
            });
        })
    })

    test("creates an id for an element without one",
    function() {
        equal("", $(".id_less_player").attr("id")+"")
        $(".id_less_player").play('./assets/dumb_example.m4v')
        ok($(".id_less_player").attr("id").length > 5)
    });


    /////////////////////////////////////////////////////////////////////////////////
    module("Utilities")

    test(".unique_id generates a unique id",
    function() {
        ok($.uniqueId() != $.uniqueId(), "generates an id like : " + $.uniqueId());
    });




});
