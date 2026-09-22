/* Reconciled owner decisions from docs/recovered/grom-balance-discussion.md.
 * Helpers here are shared by previews, descriptions and runtime resolution. */
function chillSlow(e){var r=e.st&&e.st.chill&&e.st.chill.waterRank||0;return Math.min(.50,.33+(r>=3?.03*r:0));}
RANK_TEXT[3].water='Deep Chill: Chill slows movement and actions by 33%, plus 3 percentage points per Water rank from rank 3 (maximum 50%). Immune to Chill and Freeze.';
RANK_TEXT[3].fire='Searing: +5% damage per Fire rank against Burning enemies. Immune to Burning.';
RANK_TEXT[3].earth='Venom: Earth Root applies Poison for 1 / 2 / 3 turns at Earth ranks 3 / 4 / 5+. Poison deals 10% max HP per turn, or 5% to bosses.';
RANK_TEXT[3].shadow='Fade: become Hidden after 10 / 8 / 6 / 4 consecutive unseen turns at Shadow ranks 3–6. Immune to Fear.';
ABILITIES.stormform.cost=80;
ABILITIES.stormform.desc='Instant: movement and actions take half time for 6 world-time turns. Costs 80 mana.';
ABILITIES.shadowswarm.cost=40;
ABILITIES.shadowswarm.desc='Summon up to nine Shades in a 3×3 area for 6 turns. Each has 5 HP and 5 Dark damage, scaled by your spell power at casting. Replaces your previous swarm.';
ABILITIES.arcaneward.desc='Invoke (Vellum): 8 Favor, one action. A 10-turn ward with HP equal to 10% + 2% per divine rank of maximum mana.';
GODS.vellum.boons=['Arcane Mastery: +5% maximum mana and spell damage per rank.','Spell Echo: spells repeat for free; 20% / 25% / 35% chance at ranks 3 / 4 / 5.','Grand Magus: spells cost 25% less mana; Spell Echo reaches 35%.'];
GODS.vellum.prayers=['arcanelance','unbound'];
PRAYERS.arcanelance={name:'Arcane Lance',rank:2,favor:5,desc:'Range 6: 10–16 unresisted magic damage with normal spell accuracy, power and criticals. Can Echo; works with Unbound. One action.'};
PRAYERS.manatide=PRAYERS.arcanelance;
var ARCANE_LANCE={name:'Arcane Lance',kind:'bolt',type:'magic',range:6,base:[10,16],cost:0,prayerSpell:true,icon:'ic-magic-missile'};
function echoChance(rank){return rank>=5?.35:rank===4?.25:rank===3?.20:0;}
function spellEligible(A){return A && (!A.tech&&!A.divine||A.prayerSpell);}
var ECHOING=false;
var _balanceCost=costOf;
costOf=function(A){return ECHOING||A.prayerSpell?0:_balanceCost(A);};
var _balanceConduct=spellConduct;
spellConduct=function(A){if(!ECHOING)return _balanceConduct(A);};
// Repeat before advancing the world's clock. No extra mana, Favor, piety or recursive Echo.
function withSpellEcho(A,action,repeat){
  if(ECHOING || !spellEligible(A) || player.god!=='vellum' || godRank()<3)return action();
  var advance=endTurn,did=false;
  endTurn=function(){
    if(!did){did=true;if(rng()<echoChance(godRank())){
      ECHOING=true;try{log('<b>Spell Echo.</b> The spell repeats.','c-good');repeat();}finally{ECHOING=false;}
    }return advance.apply(this,arguments);}
  };
  try{return action();}finally{endTurn=advance;}
}
var _balanceCast=castAt;
castAt=function(x,y){
  var a=aiming;if(!a)return _balanceCast(x,y);
  if(a.prayer==='arcanelance')return castArcaneLance(x,y);
  return withSpellEcho(a.A,function(){return _balanceCast(x,y);},function(){var previous=aiming;aiming=Object.assign({},a);try{_balanceCast(x,y);}finally{aiming=previous;}});
};
var _balanceUseAbility=useAbility;
useAbility=function(i){var A=ABILITIES[player.abilities[i]];return withSpellEcho(A,function(){return _balanceUseAbility(i);},function(){_balanceUseAbility(i);});};
function castArcaneLance(x,y){
  if(dist(player,{x:x,y:y})>6 || !inb(x,y) || !vis[idxOf(x,y)])return false;
  var path=boltPath(player.x,player.y,x,y),end=path[path.length-1],target=end&&foeAt(end.x,end.y);
  if(!target || target.tomb>0 || !canPray('arcanelance'))return false;
  aiming=null;player.favor-=5;player.castingSpell=true;player.castTurn=turn;player.noisy=true;setClip(player,'cast');sfx('magic-missile');
  function hit(){boltFx(player.x,player.y,target.x,target.y,'magic');if(target.hp>0 && combatRoll(hitChance(player.acc+10,evaOf(target)),true)){spellHit(target,ARCANE_LANCE,Math.round(roll(10,16)*spellPower(ARCANE_LANCE)),'magic');finishHit(target);}else floatText(target.x,target.y,'miss','miss');}
  hit();if(target.hp>0 && rng()<echoChance(godRank())){log('<b>Spell Echo.</b> Arcane Lance repeats.','c-good');hit();}
  endTurn();return true;
}
PRAYERS.luckystreak={name:'Lucky Streak',rank:2,favor:10,desc:'Instant: for 8 turns, reroll the first failed accuracy, critical, evasion, block, parry or equipment-proc roll once per turn.'};
PRAYERS.rolldice2.name='Tempt Fate';PRAYERS.rolldice2.desc='40 Amusement: 80% beneficial at rank 4, 85% at rank 5. Restoration, motes, gear or jewelry; otherwise an ambush, blood loss, displacement, or rare essence loss.';
GODS.wobbles.prayers=['luckystreak','rolldice2'];
GODS.wobbles.boons[1]='Favourite Toy: random prayers gain +10 / +15 / +20 percentage points of beneficial chance at ranks 3 / 4 / 5.';
GODS.wobbles.boons[2]='Last Laugh: survive one lethal event per unique floor at 1 HP, then receive Second Wind, Vanishing Act or Lucky Ward. Persists through travel and saves.';
function wobbleBias(r){return r>=3?.05*(r-1):0;}
function combatRoll(chance,eligible){
  var ch=Math.max(0,Math.min(1,chance||0));if(rng()<ch)return true;
  if(eligible && player.buffs && player.buffs.luckystreak>0 && player.luckyTurn!==turn){player.luckyTurn=turn;return rng()<ch;}
  return false;
}
pRoll=function(chance){return combatRoll((chance||0)+luckBonus(),true);};
function gainAmusement(n){if(player.god!=='wobbles')return;player.amusement=Math.min(100,(player.amusement||0)+n);player.amusementAt=turn;}
var _balancePrayer=usePrayer;
usePrayer=function(pid){
  if(pid==='manatide')pid='arcanelance';
  if(pid==='arcanelance'){
    if(!canPray(pid)){log('Arcane Lance requires rank 2 and 5 Favor.','c-info');return;}
    aiming={A:ARCANE_LANCE,prayer:pid};if(openSheet)showSheet(openSheet);log('Arcane Lance: choose an enemy within 6 tiles.','c-info');draw();return;
  }
  if(pid==='luckystreak'){
    if(!canPray(pid))return;player.favor-=10;player.buffs.luckystreak=8;derive(player);sfx('wobbles-giggle');updateUI();return;
  }
  return _balancePrayer(pid);
};
if(typeof STATUS_INFO!=='undefined')STATUS_INFO.luckystreak={name:'Lucky Streak',icon:'ic-pray',d:'Reroll the first failed qualifying combat roll once per turn.'};
var _balanceStatus=applyStatus;
applyStatus=function(e,key,duration,extra){
  var before=e&&e.st&&e.st[key];var r=_balanceStatus(e,key,duration,extra);
  if(e===player && !before && e.st[key] && ['burn','poison','chill','frozen','fear','blind','stun','root','corrupt','hollow'].includes(key))gainAmusement(1);
  return r;
};
var _balancePutOn=onPutOn;
onPutOn=function(it){if(it){if(it.unid&&!it.amusedUnidentified){it.amusedUnidentified=true;gainAmusement(5);}if(it.cursed&&!it.amusedCurse){it.amusedCurse=true;gainAmusement(20);}}return _balancePutOn(it);};
var _balanceTrap=triggerTrap;
triggerTrap=function(tr,e){var r=_balanceTrap(tr,e);if(e===player && !tr.amused){tr.amused=true;gainAmusement(5);}return r;};
function safeWobbleSpots(){
  var out=[];for(var y=0;y<MH;y++)for(var x=0;x<MW;x++)if(walkable(x,y)&&!occupied(x,y)&&at(x,y)!==WATER&&!(fireT&&fireT[idxOf(x,y)])&&!feats.some(function(f){return f.x===x&&f.y===y;})&&!ents.some(function(e){return e.foe&&e.hp>0&&dist(e,{x:x,y:y})<=1;}))out.push({x:x,y:y});return out;
}
greaterPrayer=function(){
  var good=rng()<.65+wobbleBias(godRank()),roll=rng();sfx('wobbles-giggle');
  function drop(it){var s=nearFree(player.x,player.y,2)||player;it.x=s.x;it.y=s.y;items.push(it);}
  if(good){
    if(roll<.35 && (player.hp<player.maxhp||player.mp<player.maxmp)){player.hp=player.maxhp;player.mp=player.maxmp;clearBad();log('<b>Tempt Fate:</b> restoration.','c-good');}
    else if(roll<.65){for(var i=0;i<2;i++){var e=pick(ELEMENTS);player.motes[e]=(player.motes[e]||0)+1;}log('<b>Tempt Fate:</b> two elemental motes.','c-good');}
    else if(roll<.9){drop(randomGear());log('<b>Tempt Fate:</b> equipment.','c-good');}
    else {drop(rng()<.5?{kind:'ring',it:makeRing(null,false)}:{kind:'amulet',it:makeAmulet(null,false)});log('<b>Tempt Fate:</b> jewelry.','c-good');}
  }else if(roll<.35){
    var pool=ents.filter(function(e){return e.foe&&e.hp>0&&!(e.base&&e.base.boss)&&!e.elite;});
    for(var i=0;i<3;i++){var s=nearFree(player.x,player.y,3);if(s){var model=pool.length?pick(pool):null;var m=spawn(model?model.kind:'rat',s.x,s.y);m.state='hunt';m.noXp=true;m.noReward=true;}}
    log('<b>Tempt Fate:</b> an unrewarding ambush!','c-you');
  }else if(roll<.70){player.hp=Math.max(1,Math.ceil(player.hp/2));applyStatus(player,'blind',4);log('<b>Tempt Fate:</b> blood and sight.','c-you');}
  else if(roll<.95){var spots=safeWobbleSpots();if(spots.length){var s=pick(spots);player.x=s.x;player.y=s.y;player._lx=undefined;}log('<b>Tempt Fate:</b> displacement.','c-you');}
  else {var loss=Math.floor(player.essence/2);player.essence-=loss;log('<b>Tempt Fate:</b> '+loss+' essence lost.','c-you');}
  computeFOV();updateUI();
};
function lastLaugh(){
  if(!capstone('wobbles')||player.hp>0||!RUN)return false;
  var id=floorNo+':'+(floorMeta.plane||'main');RUN.lastLaugh=RUN.lastLaugh||{};
  if(RUN.lastLaugh[id]||floorMeta.wobblesSaved)return false;
  RUN.lastLaugh[id]=true;floorMeta.wobblesSaved=true;player.hp=1;
  var result=Math.floor(rng()*3),spots=result===1?safeWobbleSpots():[];
  if(result===1 && spots.length){var s=pick(spots);player.x=s.x;player.y=s.y;player.hidden=3;computeFOV();log('<b>Last Laugh: Vanishing Act.</b>','c-good');}
  else if(result===2){player.ward=Math.round(player.maxhp*.5);player.buffs.arcaneward=10;log('<b>Last Laugh: Lucky Ward.</b>','c-good');}
  else {healPlayer(player.maxhp*.4);clearBad();log('<b>Last Laugh: Second Wind.</b>','c-good');}
  sfx('wobbles-giggle');return true;
}
var _balanceDamage=applyDamage;
applyDamage=function(target,amount,type,source){
  var d=_balanceDamage(target,amount,type,source);
  if(target===player && d>0)player.lastDamageTime=player.t;
  if(target===player && player.hp<=0)lastLaugh();
  return d;
};
var _balanceDeath=death;
death=function(){if(lastLaugh())return;return _balanceDeath.apply(this,arguments);};
var _balanceEnd=endTurn;
endTurn=function(){
  if(ECHOING)return;
  var before=turn,hp=player.hp,time=player.t,r=_balanceEnd.apply(this,arguments);
  if(player.hp<hp)player.lastDamageTime=player.t;
  if(turn!==before && player.god==='wobbles' && turn-(player.amusementAt||0)>20 && (turn-(player.amusementAt||0)-20)%10===0)player.amusement=Math.max(0,(player.amusement||0)-1);
  return r;
};
var _balanceDerive=derive;
derive=function(p){var r=_balanceDerive(p);if(p===player&&p.race==='dwarf')p.armor+=1;return r;};
RACES.dwarf.blurb+=' Innate +1 Armor.';
var _balanceGodKill=godOnKill;
godOnKill=function(e,by){if(e && (e.noXp||e.noReward||e.ally))return;return _balanceGodKill(e,by);};
var _balanceSigil=useSigil;
useSigil=function(use){
  var unknown=!sigilKnown[use];
  if(use==='heal'||use==='heal2'){
    if(sigilConduct(use)===false)return false;sfx('sigil-use');setClip(player,'cast');
    if(use==='heal2'){player.hp=player.maxhp;cleanseAll();}
    else {healPlayer(Math.round(player.maxhp*.35));player.buffs.afterglow=15;}
    identifySigil(use);if(unknown)gainAmusement(5);sparkleFx(player.x,player.y,'heal',30);updateUI();return true;
  }
  var r=_balanceSigil(use);if(r!==false&&unknown)gainAmusement(5);return r;
};
UNDEAD_FORMS=UNDEAD_FORMS.filter(function(f){return f.name!=='Zombie Bruiser';});
GODS.murk.boons[1]='Grave Strength: your permanent servant gains +10% health and damage per divine rank from rank 3.';
var _balanceRaise=castRaiseDead;
castRaiseDead=function(x,y,A){
  var old=ents.slice(),r=_balanceRaise(x,y,A);
  ents.forEach(function(e){if(e.undeadServant && old.indexOf(e)<0 && godRank()>=3){var scale=1+.1*godRank();e.maxhp=Math.round(e.maxhp*scale);e.hp=e.maxhp;e.dmg=e.dmg.map(function(d){return Math.round(d*scale);});}});return r;
};
