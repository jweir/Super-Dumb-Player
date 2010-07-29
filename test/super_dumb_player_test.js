$(document).ready(function(){

// pause until the movie is started
function run_after_movie_loads(callback, times_to_call){
  var called = 0;
  times_to_call = times_to_call || 1;

  $("body").bind("sdpUpdate.test_player", function(event, data){
    console.log(called, times_to_call)
    if(called < times_to_call){
      called = called + 1;
      callback();
    }
  })
}


dumb_player.player_url  = "../super_dumb_player.swf";
var test_player;

module("creation of the player skin", {
  setup : function(){
    test_player = dumb_player.create("#test_player", './assets/dumb_example.m4v');
 }
});

test("creates the flash movie", function() {
  ok(test_player.player)
  equal(test_player.player().nodeName, "OBJECT")
  equal(test_player.player(), $("#test_player")[0])
});

test("creates the player ui", function(){
  ok($(".dumb_player_ui")[0])
  ok($(".dumb_player_ui .scrubber")[0])
  ok($(".dumb_player_ui .state")[0])
  ok($(".dumb_player_ui .volume")[0])
  ok($(".dumb_player_ui .duration")[0])
  ok($(".dumb_player_ui .time")[0])
})


module("loading the movie", {
  setup : function(){
    test_player = dumb_player.create("#test_player", './assets/dumb_example.m4v');
  },
  teardown :  function(){
    $("body").unbind();
  }
})

test("sdpFlashLoaded is triggered when the movie is loaded", function(){
  stop(1000);
  $("body").bind("sdpFlashLoaded", function(){ start(); ok(true) });
})

test("sdpFlashLoaded.PLAYER_ID is triggered when the movie is loaded", function(){
  stop(1000);
  $("body").bind("sdpFlashLoaded.test_player", function(){  start(); ok(true) });
});

test("sdpState.PLAYER_ID is triggered with 'true' the movie has started or is playing", function(){
  stop(1000);
  expect(1);
  $("body").bind("sdpState.test_player", function(event, data){
    if(data == true){
      start();
      ok(true, "player started")
    }
  });
});

test("sdpUpdate.PLAYER_ID is triggered when the movie is playing; sends time based data", function(){
  stop(1000);
  expect(4);
  $("body").bind("sdpUpdate.test_player", function(event, data){
    console.log(data)
    start();
    equal(parseInt(data.duration), 24, "duration")
    equal(parseInt(data.time), 0, "time")
    equal(parseInt(data.percentage), 0)
    equal(data.loaded, 1)
  });
})


module("Movie UI", {
  setup : function(){
    test_player = dumb_player.create("#test_player", './assets/dumb_example.m4v');
  },
  teardown :  function(){
    $("body").unbind();
  }
})

test("dragging the the scrubber seeks the movie", function(){
  expect(1);
  stop(1000)
  var thumb = $(".thumb");
  var completed = function(){
    ok(parseInt($(".time").text()) > 0, "time is updated");
    start();
  }
  run_after_movie_loads(function(){
    Syn.drag({
      from: {clientX:thumb.offset().left, clientY:thumb.offset().top},
      to : {clientX:thumb.offset().left+100, clientY:thumb.offset().top}
    }, thumb, completed)
  })
})



});