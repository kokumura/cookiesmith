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
      return Math.round(value.toString());
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
  Util.delay = function(price,cps){
    return price>$g.cookies ? (price-$g.cookies)/cps : 0;
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
    var clickCps = itv===0 ? 0 : $g.computedMouseCps * clicks / (itv/1000);
    this.context.clicksPs = itv===0 ? 0 : clicks / (itv/1000);
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
    this.stgs = {
      cpcpsExp: {
        init: function(){},
        prepare: function(){},
        cost: function(context,price,cps,delay){
          return price/cps * Math.pow(2,delay/200);
        },
      },
      cpsPsConst: {
        init: function(){},
        prepare: function(){},
        cost: function(context,price,cps,delay){
          return context.cpsPs*delay - cps;
        },
      },
      cpsPsLinear:  {
        init: function(){},
        prepare: function(){},
        cost: function(context,price,cps,delay){
          return context.cpsPs*delay*delay/4 - cps;
        },
      },
      cpsPsSquare:  {
        init: function(){},
        prepare: function(){},
        cost: function(ctx,price,cps,delay){
          var t0 = Util.gameTime()/1000;
          var t1 = t0 + delay;
          var a = ctx.cpsPs / Math.pow(t0,2);
          var dcps = a/3 * (Math.pow(t1,3) - Math.pow(t0,3));
          return dcps - cps;
        },
      },
      cpsPsCube:  {
        init: function(){},
        prepare: function(){},
        cost: function(ctx,price,cps,delay){
          var t0 = Util.gameTime()/1000;
          var t1 = t0 + delay;
          var a = ctx.cpsPs / Math.pow(t0,3);
          var dcps = a/4 * (Math.pow(t1,4) - Math.pow(t0,4));
          return dcps - cps;
        },
      },
      timeLinear: {
        init: function(ctx){
          var target = 1000 * 1000;
          while(target < $g.cookiesEarned) target *= 1000;
          ctx.target = target;
        },
        prepare: function(ctx){
          while(ctx.target < $g.cookiesEarned)
            ctx.target *= 1000;
        },
        cost: function(ctx,price,cps,delay){
          var cost = price/ctx.realCps + delay;
          var target = ctx.target - $g.cookiesEarned;
          var benefit = cps*target / ((ctx.realCps+cps)*ctx.realCps);
          return cost - benefit;
        },
      },
    };

    this.param = Util.merge(this.param,{
      costDenom: $app.opt.costDenom || 60,
      luckyCookiesThreshold: $app.opt.luckyCookiesTime || 90,
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
      var ug = this.choice.obj;
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

      this.context.scores = [];
      this.context.cpsForUpgrade = {};

      this.calcCpsPs(this.context);

      if(this.context.stg.prepare) this.context.stg.prepare(this.context);

      this.calcScoresForUpgrade(this.context);
      this.calcScoresForObjects(this.context);

      //Util.forEach( scores, function(s){console.debug( s.obj.name + ': '+ s.s );} );

      target = Util.maxBy( this.context.scores, function(s){return s.s} );
    }

    target.status = this.status;
    target.lastStat = target.status();
    this.choice = target;
    this.action = this.buy;

    if(target.type==='obj'){
      var delay = target.obj.price<$g.cookies ? 0 : Math.ceil((target.obj.price-$g.cookies)/this.context.realCps);
      if(delay===0){
        return this.buy();
      } else {
        Util.log('plan to buy '+(target.obj.bought===0? 'the first ' : 'a ')+target.obj.name+' at '+Beautify(target.obj.price)+' after '+delay+' seconds' );
        Util.popup('Next: '+target.obj.name+' ('+delay+' sec.)');
      }

    } else if (target.type==='ug'){
      var delay = target.obj.basePrice<$g.cookies ? 0 : Math.ceil((target.obj.basePrice-$g.cookies)/this.context.realCps);
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
      cpss.push( $o[i].storedCps / ($o[i].price/context.realCps) );
    }
    for(var i=0;i<$u.length;i++){
      var ug = $u[i];
      if(ug.bought===1 || ug.unlocked===0 ) continue;
      var policy = this.getPolicyForUpgrade(ug.name);
      if (policy.p==='cps') {
        cpss.push( policy.cps(context,ug) / (ug.basePrice/context.realCps) );
      }
    }
    context.cpsPs = Util.sumBy(cpss)/cpss.length;
    return context;
  };
  SimpleBuyer.prototype.calcScoresForObjects = function(context){
    var scores = context.scores;
    for(var i=0;i<$o.length;i++){
      var obj = $o[i];
      var cpcps = obj.price / obj.storedCps;
      var delay = Util.delay(obj.price,this.context.realCps);
      var cost = context.stg.cost(context,obj.price,obj.storedCps,delay);
      if(cost!==undefined)
        scores.push( { type:'obj', s: -cost, obj: obj } );
    }
    return context;
  };
  SimpleBuyer.prototype.calcScoresForUpgrade = function(context){
    var scores = context.scores;
    for(var i=0;i<$u.length;i++){
      var ug = $u[i];
      if(ug.bought===1 || ug.unlocked===0 ) continue;

      var policy = this.getPolicyForUpgrade(ug.name);

      switch(policy.p){
        case 'cps':
        var cps = policy.cps(context,ug);
        var cpcps = ug.basePrice / cps;
        var delay = Util.delay(ug.basePrice,this.context.realCps);
        var cost = context.stg.cost(context,ug.basePrice,cps,delay);
        scores.push({ type:'ug', s: -cost , obj: ug, });
        break;

        case 'delay':
        if( Util.delay(ug.basePrice,this.context.realCps) <= policy.delay(context,ug) ){
          scores.push({type:'ug', s: Infinity, ug:ug, });
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
        return $g.cookiesPs/$g.globalCpsMult*rate;
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
        return $g.cookiesPs * rate * ctx.clicksPs;
      });
    }
    function kitten(rate){
      return cpsPolicy(function(ctx,ug){
        return $g.cookiesPs * ($g.milkProgress*rate);
      });
    }
    var LuckyTwice = delayPolicy(function(ctx,ug){
      ctx.param.luckyCookiesThreshold
    });
    var Default = delayPolicy(function(ctx,ug){
      ctx.param.upgradeDefaultThreshold;
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
  })();
  SimpleBuyer.prototype.status = function(){
    var stat = $g.cookiesPs;
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
      var cps = policy.cps(ctx,obj)
    }
    return {
      name: name,
      price: price,
      cps: cps,
      cost:  ctx.stg.cost(ctx,price,cps,Util.delay(price,ctx.realCps)),
      delay: Util.delay(price,ctx.realCps),
    };
  }
  SimpleBuyer.prototype.showCosts = function(){
    var ctx = this.context;
    function show(c){
      console.debug(
        c.name,
        'total:'+Util.round(c.cost),
        'cpsGain:'+Util.round(c.cps),
        'squareCost:'+Util.round(c.delay*c.delay*ctx.cpsPs/4),
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
    console.debug('cpsPs: '+ctx.cpsPs);
  }

  /*
   *  SearchBuyer extends Basic Buyer
   */
  var SearchBuyer = $app.SimpleBuyer = function(){};
  SearchBuyer.prototype = Object.create(SimpleBuyer.prototype);
  SearchBuyer.prototype.constructor = SearchBuyer();
  SearchBuyer.prototype.init = function(){
    BasicBuyer.prototype.init.apply(this); // super.super()
    this.interval = 1000;
    this.param = Util.merge(this.param,{
      luckyCookiesThreshold: $app.opt.luckyCookiesTime || 90,
      upgradeDefaultThreshold: $app.opt.upgradeDefaultTime || 60,
      cost: $app.opt.costFunc || this.costs.cpsPsCube,
    });
    this.context = Util.merge(this.context,{

    });

  }

  // set default Buyer
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
