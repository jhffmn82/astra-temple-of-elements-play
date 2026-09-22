/* Scene score shares the HUD's encounter predicate. Existing score and effects are preserved. */
var ASTRA_SCORE=['crypt','caverns','underdark','plane-fire','plane-water','plane-air','plane-earth','plane-light','plane-shadow','boss-morty','boss-maw','boss-matron'];
window.AUDIO_FILES=(window.AUDIO_FILES||[]).concat(ASTRA_SCORE.map(function(k){return 'music-'+k;}));
function explorationScore(){
  if(floorMeta && floorMeta.plane)return 'plane-'+floorMeta.plane;
  if(floorMeta && floorMeta.forge)return 'forge';
  return ['dungeon','crypt','caverns','underdark','underdark'][typeof bidx==='function'?bidx():0]||'dungeon';
}
function sceneScore(){
  var boss=activeBossEncounter();
  if(!boss)return explorationScore();
  var name=((boss.base&&boss.base.name)||boss.name||boss.kind||'').toLowerCase();
  return /mort/.test(name)?'boss-morty':/maw/.test(name)?'boss-maw':/matron/.test(name)?'boss-matron':'boss';
}
(function(){
  var basePlay=playMusic,baseStop=stopMusic;
  function isScene(k){return ['boss','dungeon','forge'].concat(ASTRA_SCORE).includes(k);}
  playMusic=function(kind){
    if(isScene(kind))kind=sceneScore();
    var r=basePlay(kind);syncAmbience(isScene(kind)?ambienceForScene():null);return r;
  };
  stopMusic=function(){baseStop();syncAmbience(null);};
  var baseBars=bars;
  bars=function(){
    var r=baseBars.apply(this,arguments),kind=AUDIO.musicKind||AUDIO.pendingMusic;
    if(isScene(kind)){
      if(player.hp<=0 || (RUN && RUN.over)){stopMusic();AUDIO.pendingMusic=null;}
      else playMusic(RUN && RUN.victory?'victory':sceneScore());
    }
    return r;
  };
})();
function ambienceForScene(){
  if(activeBossEncounter())return null;
  if(floorMeta && (floorMeta.forge||floorMeta.plane==='fire'))return 'amb-fire';
  if(floorMeta && floorMeta.plane==='water')return 'amb-water';
  return 'amb-dungeon';
}
var AMBIENCE_REQUEST=0;
function syncAmbience(name){
  if(!AUDIO.ctx || AUDIO.ambienceKind===name)return;
  AUDIO.ambienceKind=name;var request=++AMBIENCE_REQUEST;
  if(AUDIO.ambience){AUDIO.ambience.stop();AUDIO.ambience=null;}
  if(!name)return;
  loadFile(name,function(buf){
    if(!buf || AUDIO.ambienceKind!==name || request!==AMBIENCE_REQUEST)return;
    var c=AUDIO.ctx,s=c.createBufferSource(),g=c.createGain();s.buffer=buf;s.loop=true;
    g.gain.setValueAtTime(0,c.currentTime);g.gain.linearRampToValueAtTime(.16,c.currentTime+2);
    s.connect(g);g.connect(AUDIO.musicBus);s.onended=function(){s.disconnect();g.disconnect();};s.start();
    AUDIO.ambience={stop:function(){g.gain.cancelScheduledValues(c.currentTime);g.gain.setTargetAtTime(0,c.currentTime,.2);s.stop(c.currentTime+1);}};
  });
}
