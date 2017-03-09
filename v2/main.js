/**
* LOADER
*/

$(document).ready(function() {
    setTimeout(function(){
        $('body').addClass('loaded');
    }, 1250); 
});

(function() {
	"use strict";

	var canvas = document.querySelector("#loader"),
		context = canvas.getContext("2d"),
		scaleFactor = 2.5, // Noise size
		samples = [],
		sampleIndex = 0,
		scanOffsetY = 0,
		scanSize = 0,
		FPS = 50,
		scanSpeed = FPS * 15, // 15 seconds from top to bottom
		SAMPLE_COUNT = 10;

	window.onresize = function() {
		canvas.width = canvas.offsetWidth / scaleFactor;
		canvas.height = canvas.width / (canvas.offsetWidth / canvas.offsetHeight);
		scanSize = (canvas.offsetHeight / scaleFactor) / 3;

		samples = []
		for(var i = 0; i < SAMPLE_COUNT; i++)
			samples.push(generateRandomSample(context, canvas.width, canvas.height));
	};

	function interpolate(x, x0, y0, x1, y1) {
		return y0 + (y1 - y0)*((x - x0)/(x1 - x0));
	}


	function generateRandomSample(context, w, h) {	
		var intensity = [];
		var random = 0;
		var factor = h / 50;

		var intensityCurve = [];
		for(var i = 0; i < Math.floor(h / factor) + factor; i++)
			intensityCurve.push(Math.floor(Math.random() * 15));

		for(var i = 0; i < h; i++) {
			var value = interpolate((i/factor), Math.floor(i / factor), intensityCurve[Math.floor(i / factor)], Math.floor(i / factor) + 1, intensityCurve[Math.floor(i / factor) + 1]);
			intensity.push(value);
		}

		var imageData = context.createImageData(w, h);
		for(var i = 0; i < (w * h); i++) {
			var k = i * 4;
			var color = Math.floor(32 * Math.random());
			// Optional: add an intensity curve to try to simulate scan lines
			color += intensity[Math.floor(i / w)];
			imageData.data[k] = imageData.data[k + 1] = imageData.data[k + 2] = color;
			imageData.data[k + 3] = 255;
		}
		return imageData;
	} 

	function render() {
		context.putImageData(samples[Math.floor(sampleIndex)], 0, 0);

		sampleIndex += 30 / FPS; // 1/FPS == 1 second
		if(sampleIndex >= samples.length) sampleIndex = 0;

		var grd = context.createLinearGradient(0, scanOffsetY, 0, scanSize + scanOffsetY);

		grd.addColorStop(0, 'rgba(255,255,255,0)');
		grd.addColorStop(0.1, 'rgba(173,91,214,0)');
		grd.addColorStop(0.2, 'rgba(173,91,214,0.15)');
		grd.addColorStop(0.3, 'rgba(173,91,214,0)');
		grd.addColorStop(0.45, 'rgba(255,255,255,0.1)');
		grd.addColorStop(0.5, 'rgba(255,255,255,1)');
		grd.addColorStop(0.55, 'rgba(255,255,255,0.55)');
		grd.addColorStop(0.6, 'rgba(255,255,255,0.25)');
		grd.addColorStop(1, 'rgba(255,255,255,0)');

		context.fillStyle = grd;
		context.fillRect(0, scanOffsetY, canvas.width, scanSize + scanOffsetY);
		context.globalCompositeOperation = "lighter";

		scanOffsetY += (canvas.height / scanSpeed);
		if(scanOffsetY > canvas.height) scanOffsetY = -(scanSize / 2);

		window.setTimeout(function() {
			window.requestAnimationFrame(render);
		}, 1000 / FPS);
	}
	window.onresize();
	window.requestAnimationFrame(render);
})();

/**
* SITE
*/

/**
* requestAnimationFrame polyfill
*/

(function() {
  var lastTime = 0;
  var vendors = ['ms', 'moz', 'webkit', 'o'];
  for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
    window.cancelAnimationFrame =
      window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
  }
  
  if (!window.requestAnimationFrame)
    window.requestAnimationFrame = function(callback, element) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function() { callback(currTime + timeToCall); },
                                 timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };
  
  if (!window.cancelAnimationFrame)
    window.cancelAnimationFrame = function(id) {
      clearTimeout(id);
    };
}());



/**
* Carousel class
*/

function Carousel(el, opts) {
  
  var self = this;
  var $el = $(el);
  
  var $container = $("> ul", $el);
  var $panes = $("> ul > li", $el);
  
  // state
  
  var paneWidth = 0;
  var paneCount = $panes.length;
  var paneActiveIdx = 0;
  var paneActiveOffset = 0;
  
  // Add/remove event listeners, play nicely with others
  
  var startResizing = function () {
    setPaneDimensions();
    self.showPane(paneActiveIdx);
  };
  
  self.init = function() {
    $(window).on("load resize orientationchange", startResizing);
  };
  
  self.destroy = function() {
    $(window).off("load resize orientationchange", startResizing);
  };
  
  
  // set active pane
  self.showPane = function (idx, animated) {
    paneActiveIdx = Math.max(0, Math.min(idx, paneCount-1));
    
    var $wrapper = $("body");
    
    // todo: make safer
    var newCls = "show-" + paneActiveIdx;
    $wrapper.removeClass(function (idx, cls) {
      return (cls.match(/(^|\s)show-\S+/g) || []).join(' ');
    });
    $wrapper.addClass(newCls);
    
    paneActiveOffset = -(100 / paneCount) * paneActiveIdx;
    setContainerOffset(paneActiveOffset, animated);
  };
  
  self.throttledShowPane = _.debounce(function (idx, animated) {
    self.showPane(idx, animated);
  }, 100);
  
  // show next pane
  self.next = function () {
    self.throttledShowPane(paneActiveIdx + 1, true);
  };
  
  // show prev pane
  self.prev = function () {
    self.throttledShowPane(paneActiveIdx - 1, true);
  };  
  
  
  // set pane and container sizes
  function setPaneDimensions() {
    paneWidth = $el.width();
    
    _.map($panes, function (pane) {
      $(pane).width(paneWidth);
    });
    
    $container.width(paneWidth*paneCount);
  }
  
  // adjust container to active pane
  function setContainerOffset(percent, animated) {
    $container.removeClass("animate");
    
    if(animated) {
      $container.addClass("animate");
    }
    
    if (Modernizr.csstransforms3d) {
      $container.css("transform", "translate3d("+percent+"%,0,0) scale3d(1,1,1)");
    } else if (Modernizr.csstransforms) {
      $container.css("transform", "translate("+percent+"%,0)");
    } else {
      var px = ((paneWidth * paneCount) / 100) * percent;
      $container.css("left", px+"px");
    }
  }
  
  // dragging X direction
  function updateContainerOffsetX(deltaX, direction) {
    var dragOffset = ((100/paneWidth) * deltaX) / paneCount;
    
    var slowRight = paneActiveIdx == 0  && direction == Hammer.DIRECTION_RIGHT;
    var slowLeft = paneActiveIdx == paneCount-1 && direction == Hammer.DIRECTION_LEFT;
    if (slowLeft || slowRight) {
        dragOffset *= .4;
    }

    setContainerOffset(dragOffset + paneActiveOffset);
  }
  
  // set nearest pane on touch release
  function onPressRelease(deltaX, direction) {
    if(Math.abs(deltaX) > paneWidth / 2) {
      if(deltaX > 0) {
        self.prev();
      } else {
        self.next();
      }
    } else {
      self.throttledShowPane(paneActiveIdx, true);
    }
  }
  
  // hammer events
  function hammerTime(ev) {
    switch(ev.type) {
      case 'panmove': 
        updateContainerOffsetX(ev.deltaX, ev.direction);
        break;
      case 'swipeleft':
        self.next();
        break;
      case 'swiperight':
        self.prev();
        break;
    }
  }
  
  // initialize hammer
  
  var mc = new Hammer.Manager(el, {
    dragLockToAxis: true,
    dragBlockHorizontal: true
  });
  
  mc.add(new Hammer.Pan({ threshold: 10, pointers: 0 }));
  mc.add(new Hammer.Swipe().recognizeWith(mc.get('pan')));
  mc.on("swipeleft swiperight panleft panright panmove", hammerTime);
  mc.on("hammer.input", function (ev) {
    if (ev.isFinal) {
      onPressRelease(ev.deltaX, ev.direction);
    }
  });
  
}

var container = document.getElementById("carousel");
var c = new Carousel(container);
c.init();

// Nav clicks
$('[data-nav=""]').on("click", function () { 
  var $self = $(this);
  c.throttledShowPane($self.data("show"), true);
});
