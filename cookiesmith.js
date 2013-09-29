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
    var maxobj,maxvalue;
    for(var i=0;i<objs.length;i++){
      var val = f===undefined ? objs[i] : f(objs[i]);
      if (maxvalue===undefined || maxvalue < val){
        maxobj = objs[i];
        maxvalue = val;
      }
    }
    return maxobj;
  };
  Util.minBy = function(objs,f){
    var minobj,minvalue;
    for(var i=0;i<objs.length;i++){
      var val = f===undefined ? objs[i] : f(objs[i]);
      if(minvalue===undefined || minvalue > val){
        minobj = objs[i];
        minvalue = val;
      }
    }
    return minobj;
  };
  Util.sumBy = function(objs,f){
    var sum = 0;
    for(var i=0;i<objs.length;i++){
      var val = f===undefined ? objs[i] : f(objs[i]);
      if (val!==undefined) sum += val;
    }
    return sum;
  };
  Util.map = function(objs,f){
    var ret = new Array(objs.length);
    for(var i=0;i<objs.length;i++){
      ret[i] = f(objs[i]);
    }
    return ret;
  };
  Util.forEach = function(objs,f){
    for(var i=0;i<objs.length;i++) f(objs[i]);
  };
Util.median = function(values){
  var list = values.sort();
  if(list.length%2===0){
    return (list[list.length/2-1]+list[list.length/2])/2;
  } else {
    return list[Math.floor(list.length)];
  }
}

Util.gameTime = function(date){
  return (date||new Date()).getTime()-$g.startDate;
};
Util.pad0 = function(value,digit){
  if( Math.log(value)/Math.log(10) < digit ){
    var base = '0';
    for(var i=2;i<digit;i++) base+='0';
      return (base+value).slice(-digit);
  } else {
    return Math.round(value).toString();
  }
};
Util.round = function(value,digit){
  if(digit===undefined) digit = 1;
  return (Math.round(value*Math.pow(10,digit))/Math.pow(10,digit));
}
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
Util.delay = function(price,cps,cookies){
  if(cookies===undefined) cookies = $g.cookies;
  return price>$g.cookies ? (price-cookies)/cps : 0;
};
Util.merge = function(){
  var base = arguments[0];
  for(var i=1; i<arguments.length; i++){
    for(var k in arguments[i]){
      base[k] = arguments[i][k];
    }
  }
  return base;
};
Util.beautifyTime = function(sec){
  var d = Math.floor(sec/86400);
  var h = Math.floor((sec%86400)/3600);
  var m = Math.floor((sec%3600)/60);
  var s = Math.floor(sec%60);
  var str = '';
  if(d!==0) str+=d+'d ';
  if(h!==0||str!==''){
    if(str!=='') str+=Util.pad0(h,2);
    else str+=h;
  }
  if(str!=='') str+=':'+Util.pad0(m,2)
    else str+=m;
  str += ':'+Util.pad0(s,2);
  return str;
};

/*
 * Interceptor
 */
 var Interceptor = $app.Interceptor = {};
 Interceptor.orig = {};
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
  if(this.orig.Loop===undefined){
    this.orig.Loop = $g.Loop;
    $g.Loop = this.hook.Loop;
  }
};
Interceptor.remove = function(){
  if(this.orig.Loop!==undefined) {
    $g.Loop = this.orig.Loop;
  }
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
    if(this.id===undefined) return;
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
    if(chain.gh) return;
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
    this.context = {
      buyer: this,
    };
    this.param = {};
    this.processing = false;
  }
  BasicBuyer.prototype.saveStatus = function(){
    this.last.T = $g.T;
    this.last.time = $g.time;
    this.last.cookieClicks = $g.cookieClicks;
  };
  BasicBuyer.prototype.loop = function(){
    if($g.time < this.nextTime || this.processing ) return;
    this.processing = true;

    var itv = $g.time-this.last.time;
    var clicks = $g.cookieClicks - this.last.cookieClicks;
    var clicksPs = itv===0 ? 0 : clicks / (itv/1000);
    if(this.context.clicksPs && this.context.clicksPs>1 && Math.abs(this.context.clicksPs-clicksPs)<this.context.clicksPs*0.5)
      clicksPs = this.context.clicksPs*0.8 + clicksPs*0.2;
    var clickCps = $g.computedMouseCps * clicksPs;
    this.context.clicksPs = clicksPs;
    this.context.clickCps = clickCps;
    this.context.realCps = $g.cookiesPs + clickCps;

    this.action();

    if (this.last.time+this.interval < $g.time){
      this.saveStatus();
    }
    if(this.nextTime <= $g.time){
      this.nextTime = $g.time + this.interval;
    }
    this.processing = false;
  };
  BasicBuyer.prototype.start = function(){
    var self = this;
    if(this.running) this.stop();
    this.running = true;
    this.init();
    this.nextTime = $g.time + this.interval;
    Interceptor.loopHook[this.interceptorKey] = function(){self.loop()};
    Util.log('buyer started');
  };
  BasicBuyer.prototype.stop = function(){
    if(Interceptor.loopHook[this.interceptorKey]===undefined) return;
    delete Interceptor.loopHook[this.interceptorKey];
    this.running = false;
    Util.log('buyer stopped');
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
    this.stgs = {
      cpcpsExp: {
        init: function(ctx){},
        prepare: function(ctx){
          this.denom = 120;
          if(4000<=ctx.estCps)
            this.denom = 300;            
        },
        cost: function(ctx,price,cps,delay){
          var delay = price / ctx.estCps;
          return price/cps * Math.pow(2,delay/this.denom);
        },
      },
    };

    this.param = Util.merge(this.param,{
      costDenom: $app.opt.costDenom || 60,
      upgradeDefaultThreshold: $app.opt.upgradeDefaultTime || 60,
    });

    this.context = Util.merge(this.context,{
      buyer: this,
      param: this.param,
      stg : $app.opt.strategy || this.stgs.cpcpsExp,
    });

    if(this.context.stg.init) this.context.stg.init(this.context);
    this.action = this.choose;
  }
  SimpleBuyer.prototype.buy = function(){
    if(this.context===undefined || this.context.target===undefined) return;
    if(this.context.lastStat !== this.context.status(this.context)){
      Util.log('Status changed. recalculate.');
      Util.popup('Status changed. recalculate.');
      return this.choose();
    }

    if(this.context.target.type==='obj'){
      var obj = this.context.target.obj;
      if(obj.price > $g.cookies) return;
      var price = obj.price;

      obj.buy();
      Util.log('bought '+(obj.bought===1? 'the first ' : 'a ')+obj.name+' at '+Beautify(price) );
      Util.popup('bought '+(obj.bought===1? 'the first ' : 'a ')+obj.name);

    } else if (this.context.target.type==='ug') {
      var ug = this.context.target.obj;
      if(ug.basePrice > $g.cookies) return;
      ug.buy();
      Util.log('bought '+ug.name+' at '+Beautify(ug.basePrice) );
      Util.popup('bought '+ug.name );

    }
    this.action = this.choose;
  };

  SimpleBuyer.prototype.stabilize = function(ctx){
    var baseCps = $g.cookiesPs;
    var baseClickCps = ctx.clickCps;
    if($g.frenzy>0) {
      baseCps /= $g.frenzyPower;
      baseClickCps /= $g.frenzyPower;
    }
    if($g.clickFrenzy>0) baseClickCps /= 777;
    baseCps += baseClickCps;
    ctx.baseCps = baseCps;
    ctx.baseClickCps = baseClickCps;

    // estimate golden cookies effect
    var m = 5+9/2;
    var cookies = Math.max(ctx.baseCps*60,$g.cookies);
    if ($g.Has('Lucky day')) m/=2;
    if ($g.Has('Serendipity')) m/=2;
    var gcInterval = Math.ceil($g.fps*60*m);
    var gcDist = {frenzy:0.4863403449935448, multiply:0.4863403449935448, chain:0.004544942361020921, click:0.02277436765188959};
    var lucky = $g.Has('Get lucky')+1;
    var gcGain=0;
    // frenzy gain
    gcGain += 77*lucky * ctx.baseCps * gcDist.frenzy;
    // multiply
    gcGain += (Math.min(cookies*0.1,(ctx.baseCps-ctx.baseClickCps)*60*20)+13) * gcDist.multiply;
    // chain
    var chGain=0, p=1.0, e=0, et=0;
    for(var i=1;i<=13;i++){
      e = e*10+6;
      chGain += e * p;
      if(i>4){
        if(cookies+et<=e) break;
        p *= 0.9;
        et += e;
      }
    }
    gcGain += chGain * gcDist.chain;
    // click
    var gcClickGain = 777*lucky * ctx.baseClickCps * gcDist.click;

    ctx.estGcCps = (gcGain+gcClickGain)/gcInterval;
    ctx.estGcClickCps = gcClickGain/gcInterval;
    ctx.estCps = ctx.baseCps + ctx.estGcCps;
    ctx.estClickCps = ctx.baseClickCps + gcClickGain/gcInterval;

    //console.debug('estCps: '+ctx.estCps);
    //console.debug('estGcCps: '+ctx.estGcCps);
  };

  SimpleBuyer.prototype.choose = function(){
    var context = Object.create(this.context);
    
    if($g.cookiesPs<0.1){
      context.target = {
        type: 'obj',
        obj: $o[0],
        s: 0,
      };
    } else {
      context.scores = [];
      this.stabilize(context);
      //this.calcCpsPs(this.context);
      if(this.context.stg.prepare) this.context.stg.prepare(this.context);
      this.calcScoresForUpgrade(context);
      this.calcScoresForObjects(context);
      context.target = Util.maxBy( context.scores, function(s){return s.s} );
    }

    context.status = this.status;
    context.lastStat = this.status(this.context);
    
    Util.merge(this.context,context);
    this.action = this.buy;

    var estCps = this.context.estCps || this.context.realCps;
    var target = context.target;
    if(target.type==='obj'){
      var delay = target.obj.price<$g.cookies ? 0 : Math.ceil((target.obj.price-$g.cookies)/estCps);
      if(delay===0){
        return this.buy();
      } else {
        Util.log('plan to buy '+(target.obj.bought===0? 'the first ' : 'a ')+target.obj.name+' at '+Beautify(target.obj.price)+' after '+delay+' seconds' );
        Util.popup('Next: '+target.obj.name+' ('+delay+' sec.)');
      }

    } else if (target.type==='ug'){
      var delay = target.obj.basePrice<$g.cookies ? 0 : Math.ceil((target.obj.basePrice-$g.cookies)/estCps);
      if(delay===0){
        return this.buy();
      } else {
        Util.log('plan to buy the '+target.obj.name+' at '+Beautify(target.obj.basePrice)+' after '+delay+' seconds' );
        Util.popup('Next: '+target.obj.name+' ('+delay+' sec.)' );
      }
    }

  };
  SimpleBuyer.prototype.calcCpsPs = function(context){
    var cpss = [];
    for(var i=0;i<$o.length;i++){
      cpss.push( $o[i].storedCps / ($o[i].price/context.estCps) );
    }
    for(var i=0;i<$u.length;i++){
      var ug = $u[i];
      if(ug.bought===1 || ug.unlocked===0 ) continue;
      var policy = this.getPolicyForUpgrade(ug.name);
      if (policy.p==='cps') {
        cpss.push( policy.cps(context,ug) / (ug.basePrice/context.estCps) );
      }
    }
    context.cpsPs = Util.sumBy(cpss)/cpss.length;
    return context;
  };
  SimpleBuyer.prototype.calcScoresForObjects = function(context){
    var scores = context.scores = context.scores || [];
    for(var i=0;i<$o.length;i++){
      var obj = $o[i];
      var cpcps = obj.price / obj.storedCps;
      var delay = Util.delay(obj.price,this.context.estCps,0);
      var cost = context.stg.cost(context,obj.price,obj.storedCps,delay);
      if(cost!==undefined)
        scores.push( { type:'obj', s: -cost, obj: obj } );
    }
    return context;
  };
  SimpleBuyer.prototype.calcScoresForUpgrade = function(context){
    var scores = context.scores = context.scores || [];
    for(var i=0;i<$u.length;i++){
      var ug = $u[i];
      if(ug.bought===1 || ug.unlocked===0 ) continue;

      var policy = this.getPolicyForUpgrade(ug.name);

      switch(policy.p){
        case 'cps':
        var cps = policy.cps(context,ug);
        var cpcps = ug.basePrice / cps;
        var delay = Util.delay(ug.basePrice,context.estCps,0);
        if( ug.basePrice/context.estCps < 5 ){
          var cost = -Infinity;
        } else {
          var cost = context.stg.cost(context,ug.basePrice,cps,delay);
        }
        scores.push({ type:'ug', s: -cost , obj: ug, });
        break;

        case 'delay':
        if( Util.delay(ug.basePrice,this.context.estCps) <= policy.delay(context,ug) ){
          scores.push({type:'ug', s: Infinity, obj:ug, });
        }
        break;

        case 'ignore':
        default:
      }
    }
    return context;
  };
  SimpleBuyer.prototype.getPolicyForUpgrade = function(name){
    var policy = this.ugPolicyTable[name];
    if(policy===undefined)
      return this.ugPolicyTable.Default;
    else
      return policy;
  };
  SimpleBuyer.prototype.ugPolicyTable = (function(){
    function gainGlobalCpsMult(rate){
      return cpsPolicy(function(ctx,ug){
        return (ctx.estCps-ctx.estClickCps)/$g.globalCpsMult*rate;
      });
    }
    function gainBase(objName,base){
      var obj = $O[objName];
      return cpsPolicy(function(ctx,ug){
        return base * obj.amount;
      });
    }
    function gainRate(objName,rate){
      var obj = $O[objName];
      return cpsPolicy(function(ctx,ug){
        return obj.storedCps * obj.amount * (rate-1);
      });
    };
    function twice(objName){
      return gainRate(objName,2);
    }
    function gainMouseAndCursorBase(mouseBase,cursorBase){
      return cpsPolicy(function(ctx,ug){
        return (mouseBase * ctx.clicksPs) + (cursorBase * $o[0].amount);
      });
    }
    function twiceMouseAndCursor(){
      return cpsPolicy(function(ctx,ug){
        return $o[0].storedCps + ctx.clickCps;
      });
    }
    function gainMouseAndCursorByNonCursor(base){
      return cpsPolicy(function(ctx,ug){
        var amount = 0;
        for(var i=1;i<$o.length;i++){
          amount += $o[i].amount;
        }
        return base * (amount + ctx.clicksPs);
      });
    }
    function gainClickByCps(rate){
      return cpsPolicy(function(ctx,ug){
        return ctx.estCps * rate * ctx.clicksPs;
      });
    }
    function kitten(rate){
      return cpsPolicy(function(ctx,ug){
        return ctx.estCps * ($g.milkProgress*rate);
      });
    }
    var LuckyTwiceFreq = cpsPolicy(function(ctx,ug){
      return ctx.estGcCps;
    });
    var LuckyTwiceLast = cpsPolicy(function(ctx,ug){
      return ctx.estGcCps-ctx.estGcClickCps;
    })
    var Default = delayPolicy(function(ctx,ug){
      return ctx.param.upgradeDefaultThreshold;
    });
    function cpsPolicy(f){
      return { p:'cps', cps:f };
    }
    function delayPolicy(f){
      return { p:'delay', delay:f };
    }
    var Ignore = { p:'ignore' };
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
      'Lucky day': LuckyTwiceFreq,
      'Serendipity': LuckyTwiceFreq,
      'Get lucky': LuckyTwiceLast,

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
  })();
  SimpleBuyer.prototype.status = function(ctx){
    var stat = '';
    for (var i=0;i<$o.length;i++){
      stat += $o[i].bought;
    }
    for (var i=0;i<$u.length;i++){
      stat += $u[i].unlocked<<1 + $u[i].bought;
    }
    return stat;
  }

  // for debugging ...
  SimpleBuyer.prototype.costFor = function(name){
    var obj = $O[name] || $U[name];
    var ctx = this.context;
    if(obj.price!==undefined){
      var price = obj.price;
      var cps = obj.storedCps;

    } else {
      var price = obj.basePrice;
      var policy = this.getPolicyForUpgrade(obj.name);
      if(policy.p==='cps')
        var cps = policy.cps(ctx,obj);
      else
        var cps = 0;
    }
    return {
      name: name,
      price: price,
      cps: cps,
      cpcps: price/cps,
      cost:  ctx.stg.cost(ctx,price,cps,Util.delay(price,ctx.estCps)),
      delay: Util.delay(price,ctx.estCps),
    };
  }
  SimpleBuyer.prototype.showCosts = function(){
    var ctx = this.context;
    function show(c){
      console.debug(
        c.name,
        'cost:'+Beautify(c.cost),
        'cpsGain:'+Beautify(c.cps),
        'cpcps:'+Beautify(c.price/c.cps),
        'delay:'+Util.round(c.delay)
        );
    }
    var list = [];
    for(var i=0;i<$o.length;i++){
      list.push( this.costFor($o[i].name) );
    }
    for(var i=0;i<$u.length;i++){
      var ud = $u[i];
      if(ud.bought!==0 || ud.unlocked===0) continue;
      var policy = this.getPolicyForUpgrade(ud.name);
      if(policy.p!=='cps') continue;
      list.push( this.costFor(ud.name) );
    }
    var list = list.sort( function(a,b){ return a.cost==b.cost? 0 : a.cost>b.cost ? -1 : 1; } );
    Util.forEach( list,
      function(c){
        show(c);
      });
    //console.debug('cpsPs: '+ctx.cpsPs);
  }

  // set default Buyer
  var Buyer = $app.Buyer = new SimpleBuyer();

  var UI = $app.UI = {};
  UI.set = function(){
    this.origUpdateMenu = this.origUpdateMenu || $g.UpdateMenu;
    $g.UpdateMenu = this.UpdateMenuHook;
    this.cache = {};

    this.const = {
      panelId: 'comments',
      menuId: 'menu',
      buttonId: 'csButton',
      menuName: 'csmith',
    };

    var panel = document.getElementById(this.const.panelId);
    var button = document.createElement('div');
    button.className = 'button';
    button.id = this.const.buttonId;
    button.innerHTML = 'Csmith';
    var self = this;
    button.onclick = function(){
      $g.ShowMenu(self.const.menuName);
    };

    Util.merge(button.style,{
      padding: '6px 2px 0px 2px',
      'font-size': '90%',
      bottom: '16px',
      right: '65px',
    });

    panel.appendChild(button);
  };
  UI.remove = function(){
    if(this.origUpdateMenu===undefined) return;
    $g.UpdateMenu = this.origUpdateMenu;
    this.origUpdateMenu = undefined;
    var panel = document.getElementById(this.const.panelId);
    var button = document.getElementById(this.const.buttonId);
    panel.removeChild(button);
  };
  UI.WriteButton=function(label,callback){
    return '<a class="option" onclick="'+callback+'">'+label+'</a>';
  }
  UI.handle  = function(id){
    var ui = UI;
    switch(id){
      case 'remove':
      ui.cache = {};
      if($g.onMenu===this.const.menuName)
        $g.ShowMenu(this.const.menuName);
      Cookiesmith.remove();
      break;

      case 'stop':
      ui.cache = {};
      Buyer.stop();
      Clicker.stop();
      GoldHunter.stop();
      break;

      case 'start':
      ui.cache = {};
      Buyer.start();
      Clicker.start();
      GoldHunter.start();
      break;
    }
  };
  UI.UpdateMenuHook = function(){
    var ui = UI;
    ui.origUpdateMenu.apply($g);
    try {
      ui.makeMenu();
    } catch(e) {
      console.error(e.toString());
    }
  };
  UI.makeMenu = function(){
    var ui = UI;
    var csPref = 'Cookiesmith.'
    var uiPref = csPref + 'UI.'

    if($g.onMenu===ui.const.menuName){
      var str = '<div class="section">Cookiesmith Menu</div>';

      str += '<div class="subsection">'+'<div class="title">General</div>';
      str += '<div class="listing">'+ui.WriteButton('Start Cookiesmith',uiPref+"handle('start');")+'<label>(Re)Start Cookiesmith</label></div>';
      str += '<div class="listing">'+ui.WriteButton('Stop Cookiesmith',uiPref+"handle('stop');")+'<label>Stop Cookiesmith</label></div>';
      str += '<div class="listing">'+ui.WriteButton('Remove Cookiesmith',uiPref+"handle('remove');")+'<label>Stop and Remove Cookiesmith</label></div>';
      str += '</div>'; // subsection Control

      if(Buyer.running){
        str += '<div class="subsection">'+'<div class="title">Buyer</div>';

        str += '<div class="listing"><b>Estimated average Cps :</b> <div class="price plain">'+Beautify(Buyer.context.estCps)+'</div></div>';

        
        if(Buyer.context){

          var target = ui.cache.target = Buyer.context.target || ui.cache.target;
          if(target){
            var price = target.obj.price || target.obj.basePrice;
            var delay = Math.max( 0, (price-$g.cookies)/Buyer.context.realCps );
            var name = target.type==='obj' ? target.obj.name+' ('+(target.obj.amount+1)+')' : target.obj.name ;
            str += '<div class="listing"><b>Next target :</b> '+name+' &nbsp; <div class="price plain">'+Beautify(price)+'</div></div>';
            str += '<div class="listing"><b>Wait :</b> '+Math.round(delay)+'</div>';
          }else{
            str += '<div class="listing"><b>Next target :</b></div>';
            str += '<div class="listing"><b>Wait :</b></div>';          
          }

          var list = Buyer.context.scores || ui.cache.scores;
          if(list){
            ui.cache.scores = list;
            str += '<div class="listing"><b style="color:#fff;font-size:120%;">Evaluation table</b>';
            if (!list.sorted) {
              for(var i=0; i<list.length ;i++){
                list[i].costs = Buyer.costFor(list[i].obj.name);
                if(list[i].type==='obj') list[i].amount = list[i].obj.amount;
              }
              list.sort( function(a,b){ return a.costs.cpcps==b.costs.cpcps? 0 : a.costs.cpcps<b.costs.cpcps ? -1 : 1; } );
              list.sorted = true;
            }
            str += '<table><tbody>';
            str += '<tr style="text-align:left;color:gray;font-size:80%;"><th>Object Name</th><th>Cost</th><th>Cps+</th><th>Cost/Cps+</th><th>Time cost</th></tr>';
            for(var i=0; i<list.length ;i++){
              var obj = list[i].obj;
              var c = list[i].costs;
              var name = obj.name;
              if(list[i].amount!==undefined)
                name = name+' ('+(list[i].amount+1)+')';
              var nameStyle = 'border:1px gray solid;padding:2px;max-width:160px;';
              var style = 'border:1px gray solid;padding:2px;text-align:right;';
              if(target === list[i]){
                var bg = 'background-color:#666;';
                nameStyle += bg;
                style += bg;
              }
              var cps='-', cpcps='-';
              if (c.cps>0){
                cpcps = Beautify(c.cpcps);
                if(c.cps<1) cps = Util.round(c.cps,1);
                else        cps = Beautify(c.cps);
              }
              str += '<tr>';
              str += '<td style="'+nameStyle+'">'+name+'</td>';
              str += '<td style="'+style+'">'+Beautify(c.price)+'</td>';
              str += '<td style="'+style+'">'+cps+'</td>';
              str += '<td style="'+style+'">'+cpcps+'</td>';
              str += '<td style="'+style+'">'+Util.beautifyTime(c.price/Buyer.context.estCps)+'</td>';
              str += '</tr>';
            }
            str += '</tbody><table>'
            str += '</div>';
          }
        }
        str += '</div>'; // subsection
      }
      document.getElementById(ui.const.menuId).innerHTML += str;
    }
  };


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
    Util.merge($app.opt,opt);
    Interceptor.set();
    UI.set();
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
    Util.popup('started');
    return $app;
  };
  $app.stop = function(){
    Clicker.stop();
  };
  $app.remove = function(){
    $app.stop();
    UI.remove();
    Interceptor.remove();
    initialized = false;
  };
  return $app;
})(window.Game,{});
