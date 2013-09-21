var Cookiesmith = (function($g,$app){
  if(Cookiesmith!==undefined){
    return CookieSmith;
  }
  var $o = $g.ObjectsById;
  var $u = $g.UpgradesById;
  /*
   * Interceptor
   */
  var Interceptor = $app.Interceptor = {};
  Interceptor.origLoop = $g.Loop;
  Interceptor.Exec = function(){
    for(var k in Interceptor.bChain){
      Interceptor.bChain[k]();
    }    
  }
  Interceptor.Loop = function(){
    Interceptor.origLoop.apply($g);
    window.setTimeout(Interceptor.Exec,0);
  };
  Interceptor.set = function(){
    $g.Loop = this.Loop;
  };
  Interceptor.remove = function(){
    $g.Loop = this.origLoop;
  };
  Interceptor.bChain = {};

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
    if($g.goldenCookie.delay==0){
      window.setTimeout(function(){
        $g.goldenCookie.click();
        console.log('got Golden Cookie!');
      },1000);
    }
  };
  GoldHunter.start = function(){
    var chain = Interceptor.bChain;
    if(chain.gh){return;}
    chain.gh = this.hunt;
  };
  GoldHunter.stop = function(){
    delete Interceptor.bChain.gh;
  };

  /*
   * Basic Buyer
   */
  var BasicBuyer = $app.BasicBuyer = function(){};
  BasicBuyer.prototype.init = function(){
    this.interval = 1000;
    this.nextTime = 0;
    this.interceptorKey = 'basicBuyer';
  }
  BasicBuyer.prototype.loop = function(){
    if($g.time < this.nextTime) return;
    this.action();
    this.lastT = $g.T;
    this.lastTime = $g.time;
    if(this.nextTime <= $g.T){
      this.nextTime += this.interval;
    }
  };
  BasicBuyer.prototype.start = function(){
    var self = this;
    this.init();
    Interceptor.bChain[this.interceptorKey] = function(){self.loop()};
  };
  BasicBuyer.prototype.stop = function(){
    delete Interceptor.bChain[this.interceptorKey];
  };
  BasicBuyer.prototype.action = function(){
    this.nextTime = $g.T + this.interval;
  };
  BasicBuyer.prototype.func = {};
  BasicBuyer.prototype.func.maxBy = function(objs,f){
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
  BasicBuyer.prototype.func.minBy = function(objs,f){
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
  BasicBuyer.prototype.func.map = function(objs,f){
    var ret = new Array(objs.length);
    for(var i=0;i<objs.length;i++){
      ret[i] = f(objs[i]);
    }
    return ret;
  };


  /*
   * Simple Buyer extends Basic Buyer
   */
  var SimpleBuyer = $app.SimpleBuyer = function(){};
  SimpleBuyer.prototype = Object.create(BasicBuyer.prototype);
  SimpleBuyer.prototype.constructor = SimpleBuyer();
  SimpleBuyer.prototype.init = function(){
    this.interval = 1000;
    this.interceptorKey = 'simpleBuyer';
    this.baseTime = 3600;
    this.action = this.choose;    
  }
  SimpleBuyer.prototype.buy = function(){
    if(this.choice===undefined){ return };
    if(this.choice.lastStat !== this.choice.status()){
      console.log('status changed. recalculate...');
      return this.choose();
    }

    if( this.choice.obj ){
      var obj = this.choice.obj;
      if(obj.price > $g.cookies){ return; }
      this.choice = undefined;
      var price = obj.price;
      obj.buy();
      console.log('bought '+obj.name+' at '+Beautify(price) );

    } else if (this.choice.ug) {
      var ug = this.choice.ug;
      if(ug.basePrice > $g.cookies){ return; }
      this.choice = undefined;
      ug.buy();
      console.log('bought '+ug.name+' at '+Beautify(ug.basePrice) );

    }
    this.action = this.choose;
  };

  SimpleBuyer.prototype.choose = function(){
    var target = {};
    if($g.cookiesPs<0.1){
      target.obj = $o[0];
    } else {

      var ug = this.func.considerUpgrade();
      if(ug!==undefined){
        target.ug = ug;

      } else {
        var scores = [];
        for(var i=0;i<$o.length;i++){
          scores.push( this.func.score($o[i],this.baseTime) );
        }
        var maxs = this.func.maxBy( scores, function(s){return s.s} );
        //console.log( this.func.map( scores, function(o){ return o.obj.price/o.obj.cps() } ) );
        target.obj = maxs.obj;        
      }
    }

    target.status = this.func.status;
    target.lastStat = target.status();
    this.choice = target;
    this.action = this.buy;

    if(target.obj){
      var delay = target.obj.price<$g.cookies ? 0 : (target.obj.price-$g.cookies)/$g.cookiesPs;
      console.log('plan to buy '+target.obj.name+' at '+Beautify(target.obj.price)+' within '+Math.round(delay)+' seconds' );

    } else if (target.ug){
      var delay = target.ug.basePrice<$g.cookies ? 0 : (target.ug.basePrice-$g.cookies)/$g.cookiesPs;
      console.log('plan to buy '+target.ug.name+' at '+Beautify(target.ug.basePrice)+' within '+Math.round(delay)+' seconds' );

    }

  };
  SimpleBuyer.prototype.func = Object.create(BasicBuyer.prototype.func);
  SimpleBuyer.prototype.func.score = function(obj,baseTime){
    var cpcps = obj.price / obj.cps();
    var delay = obj.price > $g.cookies ? (obj.price-$g.cookies)/$g.cookiesPs : 0;

    // 待ち時間のコストは指数関数で上がるようにしたみた。
    return {
      s: - ( cpcps * ( Math.pow(2,delay/30) ) ),
      obj: obj,
    };
  }
  SimpleBuyer.prototype.func.considerUpgrade = function(){
    var maxPriceObj = this.maxBy( $o, function(o){ return o.bought>0 ? o.price : 0 } );
    for(var i=0;i<$u.length;i++){
      var ug = $u[i];
      if(ug.bought===1 || ug.unlocked===0 ){ continue; }

      // このへん適当なので何とかしたい
      if(maxPriceObj.price < 800000){
        var r = 1.5;
      } else if(maxPriceObj.price < 1666666) {
        var r = 1.0;
      } else {
        var r = 1/1.5;
      }
      if( ug.basePrice < maxPriceObj.price * r ){
        return ug;
      }
    }
    return undefined;
  }
  SimpleBuyer.prototype.func.status = function(){
    var stat = $g.cookiesPs;
    /*
    for(var i=0;i<$o.length;i++){
      stat = stat * 2 + ( $o[i].price > $g.cookies ? 0 : 1 );
    }
    */
    return stat;
  }

  var Buyer = $app.Buyer = new SimpleBuyer();

  /*
   * initializer
   */
  var initialized = false;
  $app.init = function(){
    if(initialized) return $app;
    Interceptor.set();
    initialized = true;
    return $app;
  };
  var started = false;
  $app.autoStart = function(){
    if(started) return $app;
    $app.init();
    $app.Clicker.start();
    $app.GoldHunter.start();
    $app.Buyer.start();
    started = true;
    return $app;
  };
  return $app;
})(window.Game,{});
