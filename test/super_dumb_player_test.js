$(document).ready(function() {
    dumb_player.player_url = "../super_dumb_player.swf";

    test_player;
    var default_load_time = 10000;

    // Test helper: pause until the movie is started
    function after_movie_loads(callback, times_to_call) {
        stop(default_load_time);

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

        function create_player(src) {
            src = src || "./assets/dumb_example.m4v";
            test_player = dumb_player.create("#test_player", src);
        }

        function expect_event(event_name, expected_data, callback){
            expect_event_with(
                event_name,
                function(data_value){ return data_value == expected_data },
                callback)
        }

        function expect_event_with(event_name, eval_func, callback){
            expect(1);
            $("body").bind(event_name,
        function(event, data) {
            if(eval_func(data)){
                ok(true);
                (callback || start)();
            }
        });
    }

    /////////////////////////////////////////////////////////////////////////////////
    (function() {
        module("Loading state", {
          setup: function(){
            container = $("#test_player");
          },
          teardown: function(){
            $("body").unbind();
        }});

        test("before creating the player a .loading element is visible", function(){
          $(".loading").is(":visible");
        });

        test("after creating the player a .loading element is visible and above the flash object", function(){
            stop(2000);
            $("body").bind("sdpUpdate(test_player)", function(){ ok(false, "movie loaded and should not have")});
            create_player("no_source");
            setTimeout(function(){
                ok($(".loading").css("position") == "absolute", "is absolute");
                ok($(".loading").is(":visibile"), "is visible");
                ok($(".dumb_player_ui").length == 0, "ui has not been drawn yet");
                $("body").unbind("sdpUpdate(test_player)");
                start();
            }, 1800);
        });

        test("after the player is loaded the .loaded element is hidden", function(){
          create_player();
          after_movie_loads(function(){
            ok(!$(".loading").is(":visibile"), "is visible");
            start();
          });
        });

    })();

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
            after_movie_loads(function(){
                equal(270, container.find("object").width());
                equal(360, container.find("object").height());
                start();
            })
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
            expect(1);
            after_movie_loads(function() {
                equal("visible", $(test_player.player()).css("visibility"), "flash movie is visible");
                start();
            })
        });


    })();

    /////////////////////////////////////////////////////////////////////////////////
    (function(){
      module("HTML attributes", {
          teardown: function(){
            $("body").unbind();
          }
      });

      test("the buffer_time is set via sdp_buffer_time", function(){
        $("#test_player").attr("sdp_buffer_time", 17);
        create_player();
        after_movie_loads(function(){
          start();
          equal(17, test_player.buffer_time(), "buffer time is set");
        });
      });
    })();

    /////////////////////////////////////////////////////////////////////////////////
    (function(){
        module("Functions", {
            setup: function() {
                create_player();
            },
            teardown: function() {
                $("body").unbind();
            }
        });

        test("player", function(){
            equal($("object")[0], test_player.player());
        });

        test("play: resumes playing", function(){
            after_movie_loads(function(){
                expect_event("sdpState(test_player)", true);
                test_player.play();
            });
        });

        test("pause", function(){
            after_movie_loads(function(){
                expect_event("sdpState(test_player)", false);
                test_player.pause();
            });
        });

        test("toggle starts a paused movie", function(){
            after_movie_loads(function(){
                expect_event("sdpState(test_player)", true);
                test_player.pause();
                setTimeout(function(){test_player.toggle()}, 100);
            });
        });

        test("toggle pauses a playing movie", function(){
            after_movie_loads(function(){
                expect_event("sdpState(test_player)", false);
                test_player.toggle();
            });
        });

        test("seek set the movie time", function(){
            after_movie_loads(function(){
                expect_event_with("sdpUpdate(test_player)",
                    function(d){ return d.time == 10});
                test_player.pause().seek(10);
            });
        });

        test("volume", function(){
            after_movie_loads(function(){
                expect_event("sdpVolume(test_player)", 0.8);
                expect(3);
                equal(0.8, test_player.volume(0.8));
                equal(0.8, test_player.volume(), "returns the current volume");
            });
        });

        //test("load", function(){
        //    after_movie_loads(function(){
        //        expect_event("sdpUpdate(test_player)",
        //            function(d){ return d.time == 0}));
        //        test_player.load('./assets/dumb_example.m4v');
        //    });
        //});

        //test("reset", function(){ok(false)});
        test("buffer_time", function(){
          after_movie_loads(function(){
            expect(3);
            start();
            equal(1,  test_player.buffer_time(), "default buffer of 1");
            equal(10, test_player.buffer_time(10), "update the buffer time");
            equal(10, test_player.buffer_time(), "read the buffer time");
          });
        });

        test("toggle_volume", function(){
            after_movie_loads(function(){
                expect(2);
                start();

                test_player.volume(1);
                test_player.toggle_volume();
                equal(0, test_player.volume());
                test_player.toggle_volume();
                equal(1, test_player.volume());
            });
        });


    })();

    /////////////////////////////////////////////////////////////////////////////////
    (function(){
        module("Events", {
            setup: function() {
                create_player();
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
        });

        test("are bound to EVENT_NAME(PLAYER_ID), where id is the player's DOM id",
        function() {
            stop(default_load_time);
            $("body").bind("sdpFlashLoaded(test_player)",
            function() {
                start();
                ok(true);
            });
        });

        test("time, duration, percentage, loaded are in player.status", function(){
            stop(default_load_time);
            expect(4);
            after_movie_loads(function(){
                ok(0 <= test_player.status.time, "time");
                ok(0 <= test_player.status.duration, "duration");
                ok(0 <= test_player.status.percentage, "percentage");
                ok(0 <= test_player.status.loaded, "loaded");
                start();
            });
        });
    })();

    /////////////////////////////////////////////////////////////////////////////////
    (function(){

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
            var count = 0;
            $("body").bind("sdpUpdate(test_player)",
            function(event, data) {
                if(count++ == 1){
                    start();
                    equal(parseInt(data.duration), 24, "duration")
                    equal(parseInt(data.time), 0, "time")
                    ok(data.percentage >= 0, "what % is loaded: " + data.percentage)
                    ok(data.loaded >= 0, "how much data is loaded:" + data.loaded)
                }
            });
        })

    })();

    /////////////////////////////////////////////////////////////////////////////////
    (function(){
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
            expect(4);
            stop(default_load_time);

            after_movie_loads(function() {
                var button = $(".volume");
                ok(button.find('.on').is(":visible"), "on state is visible");
                ok(!button.find('.off').is(":visible"), "off state is hidden");
                Syn
                .click({},
                button,
                function() {
                    ok(button.find('.off').is(":visible"), "button is in correct state");
                })
                .click({},
                button,
                function() {
                    ok(button.find('.on').is(":visible"), "final button state");
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
                time_after_drag;

            var test_drag = function() {
                ok(time_before_drag >= 0)

                time_after_drag = test_player.status.time;
                ok(time_after_drag > time_before_drag, "time is updated : " + time_before_drag + " " + time_after_drag);
                start();
            }

            after_movie_loads(function() {
                test_player.pause();
                Syn
                .click($(".state"))
                .delay(500, function(){time_before_drag = test_player.status.time;}) // let the movie load a bit
                .click($(".state"))
                .drag({
                    from: {
                        clientX: thumb.offset().left,
                        clientY: thumb.offset().top
                    },
                    to: {
                        clientX: thumb.offset().left + 250,
                        clientY: thumb.offset().top
                    },
                    duration: 500
                }, $(".thumb"), test_drag)
            })
        })
    })();

    /////////////////////////////////////////////////////////////////////////////////
    (function(){

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

        $.each([
           "volume" ,
           "seek",
           "toggle",
           "pause",
           "play",
           "load",
           "resize",
           "flash_event"
        ],

        function(i, func_name) {
            test("has an interface to the player's <u>"+func_name+ "</u> function",
            function() {
                test_player = $("#test_player").data("super_dumb_player");
                expect(1);
                test_player[func_name] = function(){
                    ok(true);
                }
                $("#test_player")[func_name]();
            })
        })

        test("creates an id for an element without one",
        function() {
            equal(0, ($(".id_less_player").attr("id")+"").length)
            $(".id_less_player").superDumbPlayer('./assets/dumb_example.m4v');
            ok($(".id_less_player").attr("id").length > 5, $(".id_less_player").attr("id"));
            start();

        });
    })();

    /////////////////////////////////////////////////////////////////////////////////
    (function(){

        module("Utilities")

        test(".unique_id generates a unique id",
        function() {
            ok($.uniqueId() != $.uniqueId(), "generates an id like : " + $.uniqueId());
        });

    })();



});
