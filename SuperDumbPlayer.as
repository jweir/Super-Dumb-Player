// Hi!
// Copyright 2010 by John Weir, john@famedriver.com
// Licensed under the MIT license. (feel free to use this)
// Should support F4V, MP4, M4A, MOV, MP4V, 3GP, and 3G2
// TODO fix buffering update so it shows up even when the player is paused
package {
  import flash.display.LoaderInfo;
  import flash.external.*; // woo
  import flash.display.Sprite;
	import flash.net.NetConnection;
	import flash.net.NetStream;
	import flash.media.Video;
	import flash.media.SoundTransform;
	import flash.display.Stage;
  import flash.display.StageScaleMode;
  import flash.display.StageAlign;
  import flash.display.StageDisplayState;
	import flash.events.NetStatusEvent;
  import flash.utils.Timer;
  import flash.events.TimerEvent;
  
  public class SuperDumbPlayer extends Sprite {

    var video, 
        stream, 
        metaDataStore,
        is_playing = false,
        player_id,
        timer:Timer;
    
    function SuperDumbPlayer(){
      ExternalInterface.marshallExceptions = true;
      
      stage.scaleMode = StageScaleMode.NO_SCALE;
      stage.align = StageAlign.TOP_LEFT;
      
      timer = new Timer(1000/30); // update 30 times a second
  	  timer.addEventListener(TimerEvent.TIMER, whilePlaying);
      
      video = new Video();
      var connection = new NetConnection();
			connection.connect(null);
      stream = new NetStream(connection);
      
  	  addChild(video);
  	  publicMethods();
  	  player_id = LoaderInfo(this.loaderInfo).parameters["target_id"];
  	  
  	  //ExternalInterface.call("video.initialized", player_id);
  	  ExternalInterface.call("dumb_player.event", player_id, 'flashLoaded');
    }
    
    function playState(state){
      if(state){
        timer.start();
        is_playing = true;
      } else {
        timer.stop();
        is_playing = false;
      }
      externalUpdateState();
    }

    function play(url){
      if(stream){ stream.close(); }
      playState(true)

			stream.play(url, 10);
			stream.client = {onMetaData: onMetaData};
			video.attachNetStream(stream);
			stream.addEventListener(NetStatusEvent.NET_STATUS, onNetStatus);
    }
    
    function pause(){
      playState(false);
      stream.pause();
      return is_playing;
    }
    
    function resume(){
      playState(true);
      stream.resume();
      return is_playing;
    }
    
    function togglePlayPause(){
      is_playing ? pause() : resume();
    }
    
    // TODO add a method for when the movie has stopped
    
    // seeks either the time or a percentage, if the time is a string with a % '50%'
    function seek(time){
      if((time+"").match(/%/)){
        time = parseFloat(time)/100 * metaDataStore.duration;
      }
      stream.seek(time);
    }
    
    function publicMethods(){
      ExternalInterface.addCallback("dumb_play",play);
      ExternalInterface.addCallback("dumb_pause",pause);
			ExternalInterface.addCallback("dumb_resume",resume);
			ExternalInterface.addCallback("dumb_seek",seek);
			ExternalInterface.addCallback("dumb_volume",volume);
			ExternalInterface.addCallback("dumb_status",status);
			ExternalInterface.addCallback("dumb_metaData",metaData);
			ExternalInterface.addCallback("dumb_togglePlayPause", togglePlayPause)
    }
    
    // click video to pause/resume
    // callback to update status via timer

    function status(){
      return {
        	bufferLength : stream.bufferLength,
         	bufferTime : stream.bufferTime, 
         	bytesLoaded :stream.bytesLoaded,
         	bytesTotal : stream.bytesTotal
      }
    }
        
    function volume(){
      if(arguments[0] !== undefined) stream.soundTransform = new SoundTransform(arguments[0]);
      externalUpdateVolume();
      return stream.soundTransform.volume;
    }
        
    function metaData(){
      return metaDataStore;
		}
    
    function onMetaData(data){
      metaDataStore = data;
    }
    
    function onNetStatus(e){
      trace(e.info.code);
      
      switch (e.info.code) {
        case "NetStream.Seek.Notify":
          externalUpdatePostion();
          break;
      	case "NetStream.Play.StreamNotFound":
      		trace("Stream not found.");
      	break;
      	case "NetStream.Play.Stop":
      	  trace("Movie is over")
      	  playState(false);
      	  break;
      	break;
      }
			video.width = video.videoWidth;
			video.height = video.videoHeight;
		}
		
    function whilePlaying(e){
      if(is_playing){
        externalUpdatePostion();
      }
    }
    
    function externalUpdateVolume(){
      ExternalInterface.call("dumb_player.event", player_id, 'videoVolume', (stream.soundTransform.volume > 0));
    }
    
    function externalUpdateState(){
      ExternalInterface.call("dumb_player.event", player_id, 'videoState', is_playing);
    }
    
    function externalUpdatePostion(){
      if(metaDataStore === undefined) return false;
      ExternalInterface.call("dumb_player.event", player_id, 'videoUpdate', {
        time      : stream.time,
        duration  : metaDataStore.duration,
        percentage: stream.time/metaDataStore.duration * 100,
        loaded    : stream.bytesLoaded/stream.bytesTotal
      });
    }
  }
}