$(document).ready(function(){

// Test helper: pause until the movie is started
function after_movie_loads(callback, times_to_call){
  var called = 0;
  times_to_call = times_to_call || 1;

  $("body").bind("sdpUpdate.test_player", function(event, data){
    if(called < times_to_call){
      called = called + 1;
      callback();
    }
  })
}


dumb_player.player_url  = "../super_dumb_player.swf";
var test_player;

/////////////////////////////////////////////////////////////////////////////////
module("Player skin", {
  setup : function(){
    test_player = dumb_player.create("#test_player", './assets/dumb_example.m4v');
 }
});

test("creates the flash movie object element", function() {
  ok(test_player.player)
  equal(test_player.player().nodeName, "OBJECT")
  equal(test_player.player(), $("#test_player")[0])
});

test("creates the player ui elements", function(){
  $.each(["scrubber", "state", "duration", "volume", "time"], function(i, label){
    ok($(".dumb_player_ui ."+label)[0], label+" exists");
  })
})

/////////////////////////////////////////////////////////////////////////////////
module("Events", {
  setup : function(){
    test_player = dumb_player.create("#test_player", './assets/dumb_example.m4v');
  },
  teardown :  function(){
    $("body").unbind();
  }
});

  test("are bound to EVENT_NAME", function(){
    stop(1000);
    $("body").bind("sdpFlashLoaded", function(e){
      start();
      equal(e.target, test_player.player()) });
  })

  test("are bound to EVENT_NAME(PLAYER_ID), where id is the player's DOM id", function(){
    stop(1000);
    $("body").bind("sdpFlashLoaded(test_player)", function(){ start(); ok(true) });
  })


/////////////////////////////////////////////////////////////////////////////////
module("Loading the video file", {
  setup : function(){
    test_player = dumb_player.create("#test_player", './assets/dumb_example.m4v');
  },
  teardown :  function(){
    $("body").unbind();
  }
})

  test("duration is set by the length of the loaded movie", function(){
    expect(1);
    stop(1000);
    after_movie_loads(function(){
      equal(24, parseInt($(".duration").text()), "duration should be 24");
      start();
    });
  })

  test("sdpFlashLoaded(PLAYER_ID) is triggered when the movie is loaded", function(){
    stop(1000);
    $("body").bind("sdpFlashLoaded(test_player)", function(){  start(); ok(true) });
  });

  test("sdpState(PLAYER_ID) is triggered with 'true' the movie has started or is playing", function(){
    stop(1000);
    expect(1);
    $("body").bind("sdpState.test_player", function(event, data){
      if(data == true){
        start();
        ok(true, "player started")
      }
    });
  });

  test("sdpUpdate(PLAYER_ID) is triggered when the movie is playing; sends time based data", function(){
    stop(1000);
    expect(4);
    $("body").bind("sdpUpdate(test_player)", function(event, data){
      start();
      equal(parseInt(data.duration), 24, "duration")
      equal(parseInt(data.time), 0, "time")
      equal(parseInt(data.percentage), 0)
      equal(data.loaded, 1)
    });
  })


/////////////////////////////////////////////////////////////////////////////////
module("Player UI", {
  setup : function(){
    test_player = dumb_player.create("#test_player", './assets/dumb_example.m4v');
  },
  teardown :  function(){
    $("body").unbind();
  }
})

  test("clicking the volume button toggles mute/umute", function(){
    expect(3);
    stop(10000);

    after_movie_loads(function(){
      var button = $(".volume");
      ok(button.find('.off').is(":visible"), "button is in initial state");
      Syn
      .click({}, button, function(){
        ok(button.find('.on').is(":visible"), "button is in correct state");
        })
      .click({}, button, function(){
        ok(button.find('.off').is(":visible"), "final button state");
        start();
        })
    })
  });

  test("adusting the volume sends an event with the current volume level", function(){
    stop(1000)
    var counter = 0,
        results = [0.7, 0, 1];

    expect(3);
    after_movie_loads(function(){
       $("body").bind("sdpVolume(test_player)", function(event, data){
         equal(results[counter], data, "volume set correctly");
         counter++;
         if(counter == 3){ start()} else {
           test_player.volume(results[counter]);
         }
        });
      test_player.volume(results[0]);
    })
  })

  test("clicking play button toggles play/pause", function(){
    expect(5);
    stop(10000);
    var time = 0;

    after_movie_loads(function(){
      var button = $(".state");
      ok(button.find('.play').is(":visible"), "button is in initial state");
      Syn
      .click({}, button, function(){
        ok(button.find('.pause').is(":visible"), "button is in correct state");
        time = parseFloat($(".time").text());
        ok(time >= 0, "time set")
        })
      .click({}, button, function(){
        time = parseFloat($(".time").text());
        ok(button.find('.play').is(":visible"), "final button state");
        })
      .delay(1100)
      .click({}, button, function(){
        ok(parseFloat($(".time").text()) >= time+1, "time advanded");
        start()
        })
    })
  });

  test("dragging the the scrubber seeks the movie", function(){
    expect(2);
    stop(2000)
    var thumb = $(".thumb");
    var completed = function(){
      setTimeout(function(){
        var time = parseFloat($(".time").text());
        ok(time > 0.4, "time is updated : "+time);
        start();
      }, 500)
    }

    after_movie_loads(function(){
      ok(parseFloat($(".time").text()) == 0, "time is zero");
      Syn.drag({
        from: {clientX:thumb.offset().left, clientY:thumb.offset().top},
        to : {clientX:thumb.offset().left+200, clientY:thumb.offset().top}
      }, thumb, completed)
    })
  })



});