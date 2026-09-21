/* The HUD and score share the same encounter predicate (owner ruling, issue #6).
 * Retain all existing files, synthesis fallbacks, volume controls and unlock behavior.
 */
(function(){
  var basePlay=playMusic;
  function exploration(){return floorMeta && floorMeta.forge?'forge':'dungeon';}
  playMusic=function(kind){
    if(kind==='boss'||kind==='dungeon'||kind==='forge')kind=activeBossEncounter()?'boss':exploration();
    return basePlay(kind);
  };
  var baseBars=bars;
  bars=function(){
    var r=baseBars.apply(this,arguments),kind=AUDIO.musicKind||AUDIO.pendingMusic;
    if(kind==='boss'||kind==='dungeon'||kind==='forge'){
      if(player.hp<=0 || (RUN && RUN.over)){stopMusic();AUDIO.pendingMusic=null;}
      else playMusic(RUN && RUN.victory?'victory':exploration());
    }
    return r;
  };
})();
