var Cookiesmith = (function($g,$app){
  if(Cookiesmith!==undefined){
    console.log('cookiesmith: reload');
    Cookiesmith.remove();
  }
  var $o = $g.ObjectsById;
  var $u = $g.UpgradesById;

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
      return ( value * Math.pow(0.1,digit)).toString().substring(2,2+digit);
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
    this.id = window.setInterval($g.ClickCookie,itv||50);
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
        Util.log('got a Golden Cookie!');
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
    this.realCps = $g.cookiesPs + clickCps;

    this.action();
    
    this.saveStatus();
    if(this.nextTime <= $g.T){
      this.nextTime += this.interval;
    }
  };
  BasicBuyer.prototype.start = function(){
    var self = this;
    this.init();
    Interceptor.loopHook[this.interceptorKey] = function(){self.loop()};
  };
  BasicBuyer.prototype.stop = function(){
    delete Interceptor.loopHook[this.interceptorKey];
  };
  BasicBuyer.prototype.action = function(){
    this.nextTime = $g.T + this.interval;
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
    this.costParam = 60;
    this.action = this.choose;
  }
  SimpleBuyer.prototype.buy = function(){
    if(this.choice===undefined){ return };
    if(this.choice.lastStat !== this.choice.status()){
      Util.log('status changed. recalculate...');
      return this.choose();
    }

    if( this.choice.obj ){
      var obj = this.choice.obj;
      if(obj.price > $g.cookies){ return; }
      this.choice = undefined;
      var price = obj.price;

      obj.buy();
      Util.log('bought '+(obj.bought===1? 'the first ' : 'a ')+obj.name+' at '+Beautify(price) );

    } else if (this.choice.ug) {
      var ug = this.choice.ug;
      if(ug.basePrice > $g.cookies){ return; }
      this.choice = undefined;
      ug.buy();
      Util.log('bought '+ug.name+' at '+Beautify(ug.basePrice) );

    }
    this.action = this.choose;
  };

  SimpleBuyer.prototype.choose = function(){
    var target = {};
    if($g.coookiesPs<0.1){
      target.obj = $o[0];
    } else {

      var ug = this.considerUpgrade();
      if(ug!==undefined){
        target.ug = ug;

      } else {
        var scores = [];
        for(var i=0;i<$o.length;i++){
          scores.push( this.score($o[i],this.baseTime) );
        }
        var maxs = Util.maxBy( scores, function(s){return s.s} );
        //console.log( Util.map( scores, function(o){ return o.obj.price/o.obj.cps() } ) );
        target.obj = maxs.obj;
      }
    }

    target.status = this.status;
    target.lastStat = target.status();
    this.choice = target;
    this.action = this.buy;

    if(target.obj){
      var delay = target.obj.price<$g.cookies ? 0 : (target.obj.price-$g.cookies)/this.realCps;
      Util.log('plan to buy a '+target.obj.name+' at '+Beautify(target.obj.price)+' within '+Math.round(delay)+' seconds' );

    } else if (target.ug){
      var delay = target.ug.basePrice<$g.cookies ? 0 : (target.ug.basePrice-$g.cookies)/this.realCps;
      Util.log('plan to buy the '+target.ug.name+' at '+Beautify(target.ug.basePrice)+' within '+Math.round(delay)+' seconds' );

    }

  };
  SimpleBuyer.prototype.considerUpgrade = function(){
    var maxPriceObj = Util.maxBy( $o, function(o){ return o.bought>0 ? o.price : 0 } );
    for(var i=0;i<$u.length;i++){
      var ug = $u[i];
      if(ug.bought===1 || ug.unlocked===0 ){ continue; }

      var policy = this.upgradePolicies[ug.name];
      if( policy !== undefined ){
        if(policy.name === 'ignore'){
          continue;
        }
      }

      if(maxPriceObj.price < 800000){
        var r = 1.3;
      } else if(maxPriceObj.price < 1666666) {
        var r = 1.1;
      } else if(maxPriceObj.price < 500000000){
        var r = 0.8;
      } else {
        var r = 0.6;
      }

      if( ug.basePrice < maxPriceObj.price * r ){
        return ug;
      }
    }
    return undefined;
  };
  SimpleBuyer.prototype.upgradePolicies = {'One mind':{name:'ignore'}};
  SimpleBuyer.prototype.score = function(obj){
    var cpcps = obj.price / obj.cps();
    var delay = obj.price > $g.cookies ? (obj.price-$g.cookies)/this.realCps : 0;

    return {
      s: - this.cost(cpcps,delay),
      obj: obj,
    };
  }
  SimpleBuyer.prototype.cost = function(cpcps,delay){
    return cpcps * (1+Math.pow(delay/this.costParam,2));
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


  /*
   * initializer
   */
  var initialized = false;
  $app.init = function(){
    if(initialized) return $app;
    console.log('cookiesmith: initialize');
    Interceptor.set();
    initialized = true;
    return $app;
  };
  var started = false;
  $app.autoStart = function(){
    if(started) return $app;
    $app.init();
    Clicker.start();
    GoldHunter.start();
    Buyer.start();
    started = true;
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
