// TODO allow multiple players
// TODO allow skinning
// 177 loc

(function(){

  window.dumb_player = {
    player_url  : "super_dumb_player.swf",
    create      : create,
    event       : function(id,event_name, data) {
                    $("#"+id).trigger(event_name+"."+id, data)
                  }
  };


  function create(id, video_src){
    var flashvars   = {target_id:id},
		    params      = {allowScriptAccess: "always", allowFullScreen:"true"},
		    attributes  = {},
        obj         = $("#"+id),
        player      = function() {return $("#"+id)[0]},
        original_state = obj.clone(true),
        src         = video_src;

    dumb_player.ui.create(obj);

		swfobject.embedSWF(
		    dumb_player.player_url,
		    id,
		    obj.width(),
		    obj.height(),
		    "9.0.0", null, flashvars, params, attributes);

    var self = {
        player : function(){ return player()},
        play   : function(){ player().dumb_resume(); return self},
        pause  : function(){ player().dumb_pause(); return self},
        seek   : function(time){ player().dumb_seek(time); return self},
        volume : function(value){ return player().dumb_volume(value) },
        load   : function(src){ player().dumb_play(src); return self},
        remove : function(){ $(player()).replaceWith(original_state);},
        toggle : function(){ player().dumb_togglePlayPause(); return self;},
        resize : function(h,w){ $(player()).css({width:w, height:h}); return self;},
        toggle_volume : function() {
          (player().dumb_volume() > 0) ? player().dumb_volume(0) : player().dumb_volume(0.8);
        }
    }

    $("#"+id).parent().bind("videoPlay."+id, self.play)
      .bind("videoPause."+id, self.pause)
      .bind("videoSeek."+id, function(e,d){self.seek(d)})
      .bind("videoToggle."+id, self.toggle)
      .bind("videoToggleVolume."+id, self.toggle_volume)
      .bind("flashLoaded."+id, function(){ self.load(src).volume(); return self;});

    return self;
  }
})();

(function(){

  window.dumb_player.ui = {
    create  : create,
    template :template,
    time_formater : time_formater
  };

  var ui_template = $("\
    <div class='dump_player_ui'>\
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
      <span class='duration'/>\
      <span class='time'/>\
    </div>");

  function template(obj_or_html){
    if(obj_or_html !== undefined) ui_template = $(obj_or_html);
    return ui_template;
  }

  var time_formater_func = function(str){return parseInt(str*10)/10}

  // Overwrite this function for formating the time
  function time_formater(func){
    if(func !== undefined) time_formater_func = func;
    return time_formater_func;
  }

  function create(obj){
    var id = obj.attr("id"),
        ui = $("<div class='dumb_video_player' id='dumb_player_"+id+"'></div>"),
        player_state,
        container = obj.wrap(ui).parent();

    container.append(ui_template.clone());
    dumb_player.ui.scrubber.create(id, container);

    container.find(".volume").click(function(){
      dumb_player.event(id, "videoToggleVolume");
    });

    container.find(".state").click(function(){
      dumb_player.event(id, "videoToggle");
    });

    container.bind("videoState."+id, function(event, state){
      container.find(".state").find(".play, .pause").hide();
      container.find(".state ."+ (state? "play":"pause")).show();
    });

    container.bind("videoVolume."+id, function(event, is_on){
      container.find(".volume").find(".on, .off").hide();
      container.find(".volume ."+ (is_on? "on":"off")).show();
    });
  }
})();

(function(){
  window.dumb_player.ui.scrubber = {
    create : create
  }

  function create(id, container){
    var time      = container.find(".time"),
        duration  = container.find(".duration"),
        buffer    = container.find(".buffer"),
        track     = container.find(".track"),
        thumb     = container.find(".thumb"),
        scrubber  = container.find(".scrubber"),
        player_state,
        is_dragging;

    thumb.draggable({
        start: function(){
          is_dragging = true;
          before_drag_state = player_state;
          dumb_player.event(id, "videoPause")
        },
        drag: function(e, u){
          dumb_player.event(id, "videoSeek", 100*(u.position.left/(track.width()-thumb.width()))+"%")
        },
        stop: function(){
          is_dragging = false;
          if(before_drag_state) dumb_player.event(id, "videoPlay");
        },
        containment: buffer,
        scroll: false
    });

    container.bind("videoState."+id, function(e,s){player_state = s;})

    container.bind("videoUpdate."+id, function(event, info){
      time.text(dumb_player.ui.time_formater()(info.duration));
      duration.text(dumb_player.ui.time_formater()(info.time));
      buffer.css("width", info.loaded * track.width());
      if(!is_dragging){
        thumb.css("left", (info.percentage/100) * (track.width()-thumb.width()))
      }
    });

    return scrubber;
  }
})();