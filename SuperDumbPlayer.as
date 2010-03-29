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
  import flash.events.MouseEvent;
  
  public class SuperDumbPlayer extends Sprite {

    var player, 
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
      
      player = new Video();
      var connection = new NetConnection();
			connection.connect(null);
      stream = new NetStream(connection);
      
  	  addChild(player);
  	  publicMethods();
  	  player_id = param("target_id");
  	  
  	  ExternalInterface.call("dumb_player.event", player_id, 'sdpFlashLoaded');
  	  initMouseEvents();
    }
    
    var eventCapture;
    
    function initMouseEvents(){
      eventCapture = new Sprite();
      eventCapture.graphics.beginFill(0xFFFFFF, 0);
      eventCapture.graphics.drawRect(0, 0, 10,10);
      addChild(eventCapture);
      
      var events = ["MOUSE_DOWN","MOUSE_MOVE","MOUSE_OUT","MOUSE_OVER","MOUSE_UP","MOUSE_WHEEL"];
      for(var i = 0; i < events.length; i++){
        addEventListener(MouseEvent[events[i]], mouseEvent);
      }
    }
    
    function mouseEvent(event){
      var obj = {};
      
      var p = [
        "type",
        "bubbles",   
        "cancelable",   
        "eventPhase",
        "localX",       
        "localY",       
        "stageX",       
        "stageY",
        "relatedObject", 
        "ctrlKey",
        "altKey", 
        "shiftKey", 
        "buttonDown", 
        "delta"];
      
      for(var i = 0; i < p.length; i++) {
        obj[p[i]] = event[p[i]];
      }

      ExternalInterface.call("dumb_player.event", player_id, 'sdpFlashEvent', obj);
    }
    
    var params = {};
    
    function param(name){
      return params[name] = params[name] || LoaderInfo(this.loaderInfo).parameters[name];
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

			stream.play(url, 0);
			stream.client = {onMetaData: onMetaData};
			player.attachNetStream(stream);
			stream.addEventListener(NetStatusEvent.NET_STATUS, onNetStatus);
			if(param("auto_play") == "off"){
			  pause(); 
			}
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
      trace("onMetaData")
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
      eventCapture.width = player.videoWidth;
      eventCapture.height = player.videoHeight;
			player.width = player.videoWidth;
			player.height = player.videoHeight;
		}
		
    function whilePlaying(e){
      if(is_playing){
        externalUpdatePostion();
      }
    }
    
    function externalUpdateVolume(){
      ExternalInterface.call("dumb_player.event", player_id, 'sdpVolume', (stream.soundTransform.volume > 0));
    }
    
    function externalUpdateState(){
      ExternalInterface.call("dumb_player.event", player_id, 'sdpState', is_playing);
    }
    
    function externalUpdatePostion(){
      if(metaDataStore === undefined) return false;
      ExternalInterface.call("dumb_player.event", player_id, 'sdpUpdate', {
        time      : stream.time,
        duration  : metaDataStore.duration,
        percentage: stream.time/metaDataStore.duration * 100,
        loaded    : stream.bytesLoaded/stream.bytesTotal
      });
    }
  }
}