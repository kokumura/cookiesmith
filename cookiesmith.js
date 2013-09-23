var Cookiesmith = (function($g,$app){
  if(Cookiesmith!==undefined){
    console.log('cookiesmith: reload');
    Cookiesmith.Util.popup('reload');
    Cookiesmith.remove();
  }
  var $o = $g.ObjectsById;
  var $O = $g.Objects;
  var $u = $g.UpgradesById;
  var $U = $g.Upgrades;

  $app.opt = { popup:true, clickPs:20, clicker:true, goldHunter:true, buyer:true, };

  /*
   * Utility
   */
  var Util = $app.Util = {};
  Util.maxBy = function(objs,f){
    var maxobj = objs[0];
    var maxvalue = f(maxobj);
    for(var i=1;i<objs.length;i++){
      var val = f(objs[i]);
      if (maxvalue < val){
        maxobj = objs[i];
        maxvalue = val;
      }
    }
    return maxobj;
  };
  Util.minBy = function(objs,f){
    var minobj = objs[0];
    var minvalue = f(minobj);
    for(var i=1;i<objs.length;i++){
      var val = f(objs[i]);
      if (val!==undefined){
        if(minvalue===undefined || minvalue > val){
          minobj = objs[i];
          minvalue = val;
        }
      }
    }
    return minobj;
  };
  Util.map = function(objs,f){
    var ret = new Array(objs.length);
    for(var i=0;i<objs.length;i++){
      ret[i] = f(objs[i]);
    }
    return ret;
  };
  Util.gameTime = function(date){
    return (date||new Date()).getTime()-$g.startDate;
  };
  Util.pad0 = function(value,digit){
    if( Math.log(value)/Math.log(10) < digit ){
      var base = '0';
      for(var i=2;i<digit;i++) base+='0';
      return (base+value).slice(-digit);
    } else {
      return Math.round(value.toString());
    }
  };
  Util.formatDate = function(date){
    var year = date.getYear()+1900;
    var day = Util.pad0(date.getDate(),2);
    var month = Util.pad0(date.getMonth()+1,2);
    var hour = Util.pad0(date.getHours(),2);
    var minute = Util.pad0(date.getMinutes(),2);
    var second = Util.pad0(date.getSeconds(),2);
    return year+'/'+month+'/'+day+' '+hour+':'+minute+':'+second;
  };
  Util.log = function(message){
    var date = new Date();
    var gameTime = Util.pad0(Math.round(Util.gameTime(date)/1000),6);
    var formatDate = Util.formatDate(date);
    console.log('['+formatDate+' '+gameTime+'] '+message);
  };
  Util.popup = function(message){
    if($app.opt.popup)
      $g.Popup('[Csmith] '+message);
  };
  Util.ordNum = function(num){
    switch(num){
      case 1: return 'first';
      case 2: return 'second';
      case 3: return 'third';
      default:
      switch(num%100){
        case 11: 
        case 12: 
        case 13: return num+'th';
        default:
        switch(num%10){
          case 1: return num+'st';
          case 2: return num+'nd';
          case 3: return num+'rd';
          default: return num+'th';
        }
      }
    }
  };

  /*
   * Interceptor
   */
  var Interceptor = $app.Interceptor = {};
  Interceptor.orig = {
    Loop: $g.Loop,
    confirm: window.confirm,
  };
  Interceptor.hook = {};
  Interceptor.hook.Loop = function(){
    Interceptor.orig.Loop.apply($g);
    window.setTimeout(function(){
      for(var k in Interceptor.loopHook){
        Interceptor.loopHook[k]();
      }
    },0);
  };
  Interceptor.hook.confirm = function(){
    var res = undefined;
    for(var k in Interceptor.confirmHook){
      var res0 = Interceptor.confirmHook[k].apply(window,arguments);
      if(res0!==undefined){
        res = res0;
      }
    }
    if(res!==undefined){
      return res;
    } else {
      return Interceptor.orig.confirm.apply(window,arguments);
    }
  };

  Interceptor.set = function(){
    $g.Loop = this.hook.Loop;
    //window.confirm = this.hook.confirm;
  };
  Interceptor.remove = function(){
    $g.Loop = this.orig.Loop;
    //window.confirm = this.orig.confirm;
  };
  Interceptor.loopHook = {};
  Interceptor.confirmHook = {};

  /*
   * Clicker
   */
  var Clicker = $app.Clicker = {};
  Clicker.start = function(itv){
    if(this.id!==undefined){this.stop();}
    this.id = window.setInterval($g.ClickCookie,itv||1000/$app.opt.clickPs);
  };
  Clicker.stop = function(){
    if(this.id===undefined){return;}
    window.clearInterval(this.id);
    this.id = undefined;
  };

  /*
   * GoldHunter
   */
  var GoldHunter = $app.GoldHunter = {};
  GoldHunter.hunt = function(){
    var self = GoldHunter;
    if(!self.hunting && $g.goldenCookie.delay==0 && $g.goldenCookie.toDie!==1 && $g.goldenCookie.wrath!==1 ){
      self.hunting = true;
      window.setTimeout(function(){
        $g.goldenCookie.click();
        Util.log('got the '+Util.ordNum($g.goldenClicks)+' Golden Cookie!');
        Util.popup('got the '+Util.ordNum($g.goldenClicks)+' Golden Cookie!');
        self.hunting = false;
      },1000);
    }
  };
  GoldHunter.start = function(){
    var chain = Interceptor.loopHook;
    if(chain.gh){return;}
    chain.gh = this.hunt;
  };
  GoldHunter.stop = function(){
    delete Interceptor.loopHook.gh;
  };

  /*
   * Basic Buyer
   */
  var BasicBuyer = $app.BasicBuyer = function(){};
  BasicBuyer.prototype.init = function(){
    this.interval = 1000;
    this.nextTime = 0;
    this.interceptorKey = 'basicBuyer';
    this.last = {};
    this.saveStatus();
  }
  BasicBuyer.prototype.saveStatus = function(){
    this.last.T = $g.T;
    this.last.time = $g.time;
    this.last.cookieClicks = $g.cookieClicks;
  };
  BasicBuyer.prototype.loop = function(){
    if($g.time < this.nextTime) return;

    var itv = $g.time-this.last.time;
    var clicks = $g.cookieClicks - this.last.cookieClicks;
    var clickCps = itv===0 ? 0 : $g.computedMouseCps * clicks / (itv/1000);
    this.clicksPs = itv===0 ? 0 : clicks / (itv/1000);
    this.clickCps = clickCps;
    this.realCps = $g.cookiesPs + clickCps;

    this.action();

    if (this.last.time+this.interval < $g.time){
      this.saveStatus();
    }
    if(this.nextTime <= $g.time){
      this.nextTime = $g.time + this.interval;
    }
  };
  BasicBuyer.prototype.start = function(){
    var self = this;
    this.init();
    this.nextTime = $g.time + this.interval;
    Interceptor.loopHook[this.interceptorKey] = function(){self.loop()};
  };
  BasicBuyer.prototype.stop = function(){
    delete Interceptor.loopHook[this.interceptorKey];
  };
  BasicBuyer.prototype.action = function(){
    this.nextTime = $g.time + this.interval;
  };

  /*
   * Simple Buyer extends Basic Buyer
   */
  var SimpleBuyer = $app.SimpleBuyer = function(){};
  SimpleBuyer.prototype = Object.create(BasicBuyer.prototype);
  SimpleBuyer.prototype.constructor = SimpleBuyer();
  SimpleBuyer.prototype.init = function(){
    BasicBuyer.prototype.init.apply(this); // super()
    this.interval = 1000;
    this.interceptorKey = 'simpleBuyer';
    this.param = {
      costDenom: $app.opt.costDenom || 60,
      luckyCookiesThreshold: $app.opt.luckyCookiesTime || 90,
      upgradeDefaultThreshold: $app.opt.upgradeDefaultTime || 60,
    };
    this.policiesForUpgrade = this.getPoliciesForUpgrade();
    this.action = this.choose;
  }
  SimpleBuyer.prototype.buy = function(){
    if(this.choice===undefined){ return };
    if(this.choice.lastStat !== this.choice.status()){
      Util.log('Cps changed. retry planning.');
      Util.popup('Cps changed. retry planning.');
      return this.choose();
    }

    if(this.choice.type==='obj'){
      var obj = this.choice.obj;
      if(obj.price > $g.cookies){ return; }
      this.choice = undefined;
      var price = obj.price;

      obj.buy();
      Util.log('bought '+(obj.bought===1? 'the first ' : 'a ')+obj.name+' at '+Beautify(price) );
      Util.popup('bought '+(obj.bought===1? 'the first ' : 'a ')+obj.name);

    } else if (this.choice.type==='ug') {
      var ug = this.choice.ug;
      if(ug.basePrice > $g.cookies){ return; }
      this.choice = undefined;
      ug.buy();
      Util.log('bought '+ug.name+' at '+Beautify(ug.basePrice) );
      Util.popup('bought '+ug.name );

    }
    this.action = this.choose;
  };

  SimpleBuyer.prototype.choose = function(){
    if($g.cookiesPs<0.1){
      target = {
        type: 'obj',
        obj: $o[0],
        s: 0,
      }
    } else {
      var scores = [];
      this.getScoresForUpgrade(scores);
      this.getScoresForObjects(scores);
      target = Util.maxBy( scores, function(s){return s.s} );
    }

    target.status = this.status;
    target.lastStat = target.status();
    this.choice = target;
    this.action = this.buy;

    if(target.type==='obj'){
      var delay = target.obj.price<$g.cookies ? 0 : Math.ceil((target.obj.price-$g.cookies)/this.realCps);
      if(delay===0){
        return this.buy();
      } else {
        Util.log('plan to buy '+(target.obj.bought===1? 'the first ' : 'a ')+target.obj.name+' at '+Beautify(target.obj.price)+' after '+delay+' seconds' );
        Util.popup('Next: '+target.obj.name+' ('+delay+' sec.)');
      }

    } else if (target.type==='ug'){
      var delay = target.ug.basePrice<$g.cookies ? 0 : Math.ceil((target.ug.basePrice-$g.cookies)/this.realCps);
      if(delay===0){
        return this.buy();
      } else {
        Util.log('plan to buy the '+target.ug.name+' at '+Beautify(target.ug.basePrice)+' after '+delay+' seconds' );
        Util.popup('Next: '+target.ug.name+' ('+delay+' sec.)' );
      }
    }

  };
  SimpleBuyer.prototype.getScoresForObjects = function(scores){
    scores = scores || [];
    for(var i=0;i<$o.length;i++){
      var score = this.scoreForObject($o[i]);
      if(score!==undefined)
        scores.push( { type:'obj', s: score, obj: $o[i] } );
    }
    return scores;
  };
  SimpleBuyer.prototype.getScoresForUpgrade = function(scores){
    scores = scores||[];
    for(var i=0;i<$u.length;i++){
      var ug = $u[i];
      if(ug.bought===1 || ug.unlocked===0 ){ continue; }

      var policy = this.policiesForUpgrade[ug.name];

      if (policy===null){
        continue;
      } else if( typeof policy !== 'function'){
        policy = this.upgradePolicies.Default;
      }

      var score = policy(ug);
      if(score!==null)
          scores.push({ type:'ug', s: score, ug: ug, });
    }
    return scores;
  };
  SimpleBuyer.prototype.getPoliciesForUpgrade = function(){
    var buyer = this;
    function ugDelay(ug){
      return ug.basePrice > $g.cookies ? (ug.basePrice-$g.cookies)/buyer.realCps : 0;
    }
    function gainGlobalCpsMult(rate){
      return function(ug){
        var cpcps =  ug.basePrice / ($g.cookiesPs/$g.globalCpsMult*rate);
        return -buyer.cost(cpcps,ugDelay(ug));
      };
    }
    function gainBase(objName,base){
      var obj = $O[objName];
      return function(ug){
        if(obj.amount===0) return null;
        var cpcps = ug.basePrice / (base * obj.amount);
        return -buyer.cost(cpcps,ugDelay(ug));
      };
    }
    function gainRate(objName,rate){
      var obj = $O[objName];
      return function(ug){
        if(obj.amount===0) return null;
        var cpcps = ug.basePrice / (obj.storedCps * obj.amount * (rate-1));
        return -buyer.cost(cpcps,ugDelay(ug));
      };
    };
    function twice(objName){
      return gainRate(objName,2);
    }
    function gainMouseAndCursorBase(mouseBase,cursorBase){
      return function(ug){
        var cps = (mouseBase * buyer.clicksPs) + (cursorBase * $o[0].amount);
        var cpcps = ug.basePrice / cps;
        return -buyer.cost(cpcps,ugDelay(ug));
      };
    }
    function twiceMouseAndCursor(){
      return function(ug){
        var cps = $o[0].storedCps + buyer.clickCps;
        var cpcps = ug.basePrice / cps;
        return -buyer.cost(cpcps,ugDelay(ug));
      };
    }
    function gainMouseAndCursorByNonCursor(base){
      return function(ug){
        var amount = 0;
        for(var i=1;i<$o.length;i++){
          amount += $o[i].amount;
        }
        var cpcps = ug.basePrice / ( base * (amount + buyer.clicksPs));
        return -buyer.cost(cpcps,ugDelay(ug));
      };
    }
    function gainClickByCps(rate){
      return function(ug){
        var cpcps = ug.basePrice / ($g.cookiesPs * rate * buyer.clicksPs);
        return -buyer.cost(cpcps,ugDelay(ug));
      };
    }
    function kitten(rate){
      return function(ug){
        var cpcps = ug.basePrice / ($g.cookiesPs * ($g.milkProgress*rate));
        return -buyer.cost(cpcps,ugDelay(ug));
      };
    }
    function delayLessThan(threshold){
      return function(ug){
        return ugDelay(ug)>threshold ? null : 0;
      };
    }

    var LuckyTwice = delayLessThan( buyer.param.luckyCookiesThreshold );

    var BuySoon = function(){return Infinity}
    var Default = delayLessThan( buyer.param.upgradeDefaultThreshold );
    var Ignore = null;

    return {
      // used when no policies matched
      Default: Default,

      // Cursor
      'Reinforced index finger': gainMouseAndCursorBase(1,0.1),
      'Carpal tunnel prevention cream': twiceMouseAndCursor(),
      'Ambidextrous': twiceMouseAndCursor(),
      'Thousand fingers': gainMouseAndCursorByNonCursor(0.1),
      'Million fingers': gainMouseAndCursorByNonCursor(0.5),
      'Billion fingers': gainMouseAndCursorByNonCursor(2),
      'Trillion fingers': gainMouseAndCursorByNonCursor(10),
      'Quadrillion fingers': gainMouseAndCursorByNonCursor(20),
      'Quintillion fingers': gainMouseAndCursorByNonCursor(100),

      // Mouse
      'Plastic mouse': gainClickByCps(0.01),
      'Iron mouse': gainClickByCps(0.01),
      'Titanium mouse': gainClickByCps(0.01),
      'Adamantium mouse': gainClickByCps(0.01),

      // Grandma
      'Forwards from grandma': gainBase('Grandma',0.3),
      'Steel-plated rolling pins': twice('Grandma'),
      'Lubricated dentures': twice('Grandma'),
      'Prune juice': twice('Grandma'),
      'Farmer grandmas': twice('Grandma'),
      'Worker grandmas': twice('Grandma'),
      'Miner grandmas': twice('Grandma'),
      'Cosmic grandmas': twice('Grandma'),
      'Transmuted grandmas': twice('Grandma'),
      'Altered grandmas': twice('Grandma'),
      "Grandmas' grandmas": twice('Grandma'),
      "Antigrandmas": twice('Grandma'),

      // Farm
      'Cheap hoes': gainBase('Farm',0.5),
      'Fertilizer': twice('Farm'),
      'Cookie trees': twice('Farm'),
      'Genetically-modified cookies': twice('Farm'),

      // Factory
      'Sturdier conveyor belts': gainBase('Factory',4),
      'Child labor': twice('Factory'),
      'Sweatshop': twice('Factory'),
      'Radium reactors': twice('Factory'),

      // Mine
      'Sugar gas': gainBase('Mine',10),
      'Megadrill': twice('Mine'),
      'Ultradrill': twice('Mine'),
      'Ultimadrill': twice('Mine'),

      // Shipment
      'Vanilla nebulae': gainBase('Shipment',30),
      'Wormholes': twice('Shipment'),
      'Frequent flyer': twice('Shipment'),
      'Warp drive': twice('Shipment'),

      // Alchemy lab
      'Antimony': gainBase('Alchemy lab',100),
      'Essence of dough': twice('Alchemy lab'),
      'True chocolate': twice('Alchemy lab'),
      'Ambrosia': twice('Alchemy lab'),

      // Portal
      'Ancient tablet': gainBase('Portal',1666),
      'Insane oatling workers': twice('Portal'),
      'Soul bond': twice('Portal'),
      'Sanity dance': twice('Portal'),

      // Time machine
      'Flux capacitors': gainBase('Time machine',9874),
      'Time paradox resolver': twice('Time machine'),
      'Quantum conundrum': twice('Time machine'),
      'Causality enforcer': twice('Time machine'),

      // Antimatter condenser
      'Sugar bosons': gainBase('Antimatter condenser',99999),
      'String theory': twice('Antimatter condenser'),
      'Large macaron collider': twice('Antimatter condenser'),
      'Big bang bake': twice('Antimatter condenser'),

      // Golden Cookies
      'Lucky day': LuckyTwice,
      'Serendipity': LuckyTwice,
      'Get lucky': LuckyTwice,

      // Kittens
      'Kitten helpers': kitten(0.05),
      'Kitten workers': kitten(0.1),
      'Kitten engineers': kitten(0.2),
      'Kitten overseers': kitten(0.3),

      // Cookies
      'Oatmeal raisin cookies': gainGlobalCpsMult(0.05),
      'Peanut butter cookies': gainGlobalCpsMult(0.05),
      'Plain cookies': gainGlobalCpsMult(0.05),
      'Coconut cookies': gainGlobalCpsMult(0.05),
      'White chocolate cookies': gainGlobalCpsMult(0.05),
      'Macadamia nut cookies': gainGlobalCpsMult(0.05),
      'Sugar cookies': gainGlobalCpsMult(0.05),

      'Double-chip cookies': gainGlobalCpsMult(0.1),
      'White chocolate macadamia nut cookies': gainGlobalCpsMult(0.1),
      'All-chocolate cookies': gainGlobalCpsMult(0.1),

      'Dark chocolate-coated cookies': gainGlobalCpsMult(0.15),
      'White chocolate-coated cookies': gainGlobalCpsMult(0.15),
      'Eclipse cookies': gainGlobalCpsMult(0.15),
      'Zebra cookies': gainGlobalCpsMult(0.15),
      'Snickerdoodles': gainGlobalCpsMult(0.15),
      'Stroopwafels': gainGlobalCpsMult(0.15),
      'Macaroons': gainGlobalCpsMult(0.15),
      'Empire biscuits': gainGlobalCpsMult(0.15),
      'British tea biscuits': gainGlobalCpsMult(0.15),
      'Chocolate british tea biscuits': gainGlobalCpsMult(0.15),
      'Round british tea biscuits': gainGlobalCpsMult(0.15),
      'Round chocolate british tea biscuits': gainGlobalCpsMult(0.15),
      'Round british tea biscuits with heart motif': gainGlobalCpsMult(0.15),
      'Round chocolate british tea biscuits with heart motif': gainGlobalCpsMult(0.15),

      'Madeleines': gainGlobalCpsMult(0.2),
      'Palmiers': gainGlobalCpsMult(0.2),
      'Palets': gainGlobalCpsMult(0.2),
      'Sabl&eacute;s': gainGlobalCpsMult(0.2),

      // Research
      'Bingo center/Research facility': gainRate('Grandma',4),
      'Specialized chocolate chips': gainGlobalCpsMult(0.01),
      'Designer cocoa beans': gainGlobalCpsMult(0.02),
      'Ritual rolling pins': twice('Grandma'),
      'Underworld ovens': gainGlobalCpsMult(0.03),

      // Research(after One mind)
      'Exotic nuts': gainGlobalCpsMult(0.04),
      'Arcane sugar': gainGlobalCpsMult(0.05),
      'Sacrificial rolling pins': Ignore,

      // door for wrath
      'One mind': Ignore,
      'Communal brainsweep': Ignore,
      'Elder Pact': Ignore,

      // Repeatable
      'Elder Pledge': Ignore,
      'Elder Covenant': Ignore,
      'Revoke Elder Covenant': Ignore,

      // "Debug purpose only"
      'Ultrascience': Ignore,
      'Gold hoard': Ignore,
      'Neuromancy': Ignore,
    };
  };
  SimpleBuyer.prototype.scoreForObject = function(obj){
    var cpcps = obj.price / obj.storedCps;
    var delay = obj.price > $g.cookies ? (obj.price-$g.cookies)/this.realCps : 0;
    return - this.cost(cpcps,delay);
  }
  SimpleBuyer.prototype.cost = function(cpcps,delay){
    return cpcps * (1+Math.pow(delay/this.param.costDenom,2));
  };
  SimpleBuyer.prototype.status = function(){
    var stat = $g.cookiesPs;
    return stat;
  }

  var Buyer = $app.Buyer = new SimpleBuyer();

  /*
   * Cheater
   */
   var Cheater = $app.Cheater = {};
  Cheater.getCookies = function(number){
    $g.cookiesEarned += number;
    $g.cookies += number;
    Util.log( 'got '+Beautify(number)+' cookies.' );
  };
  Cheater.showGold = function(){
    $g.goldenCookie.delay = 10;
  };
  var gr_id = -1;
  Cheater.goldRush = function(interval){
    window.clearInterval(gr_id);
    if(interval>0){
      gr_id = window.setInterval( Cheater.showGold , interval );
    }
  };
  Cheater.instantResearch = function(){
    Interceptor.loopHook.instantResearch = function(){
      if($g.researchT > 1) $g.researchT = 1;
    };
  };
  Cheater.iAmNotACheater = function(){
    $g.Achievements['Cheated cookies taste awful'].won = 0;
  };
  Cheater.getNeuromancy = function(){
    var neuro = $U['Neuromancy'];
    this.getCookies(neuro.basePrice);
    neuro.buy();
  }

  /*
   * initializer
   */
  var initialized = false;
  $app.init = function(opt){
    if(initialized) return $app;
    console.log('cookiesmith: initialize');
    for(var key in opt) $app.opt[key] = opt[key];
    Interceptor.set();
    initialized = true;
    return $app;
  };
  var started = false;
  $app.autoStart = function(opt){
    if(started) return $app;
    $app.init(opt);
    if($app.opt.clicker)     Clicker.start();
    if($app.opt.goldHunter)  GoldHunter.start();
    if($app.opt.buyer)       Buyer.start();
    started = true;
    Util.log('operation started');
    Util.popup('started');
    return $app;
  };
  $app.remove = function(){
    if(initialized){
      Interceptor.remove();
    }
    if(started){
      Clicker.stop();
    }
  };
  return $app;
})(window.Game,{});
