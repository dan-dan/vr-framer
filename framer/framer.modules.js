require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"VRComponent":[function(require,module,exports){
"\nVRComponent class\n\nproperties\n- front (set: imagePath <string>, get: layer)\n- right\n- back\n- left\n- top\n- bottom\n- heading <number>\n- elevation <number>\n- tilt <number> readonly\n\n- panning <bool>\n- mobilePanning <bool>\n- arrowKeys <bool>\n\n- lookAtLatestProjectedLayer <bool>\n\nmethods\n- projectLayer(layer) # heading and elevation are set as properties on the layer\n- hideEnviroment()\n\nevents\n- onOrientationChange (data {heading, elevation, tilt})\n\n--------------------------------------------------------------------------------\n\nVRLayer class\n\nproperties\n- heading <number> (from 0 up to 360)\n- elevation <number> (from -90 down to 90 up)\n";
var KEYS, KEYSDOWN, SIDES, VRAnchorLayer,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

SIDES = ["north", "front", "east", "right", "south", "back", "west", "left", "top", "bottom"];

KEYS = {
  LeftArrow: 37,
  UpArrow: 38,
  RightArrow: 39,
  DownArrow: 40
};

KEYSDOWN = {
  left: false,
  up: false,
  right: false,
  down: false
};

Events.OrientationDidChange = "orientationdidchange";

VRAnchorLayer = (function(superClass) {
  extend(VRAnchorLayer, superClass);

  function VRAnchorLayer(layer, cubeSide) {
    VRAnchorLayer.__super__.constructor.call(this);
    this.width = 2;
    this.height = 2;
    this.clip = false;
    this.name = "anchor";
    this.cubeSide = cubeSide;
    this.backgroundColor = null;
    this.layer = layer;
    layer.parent = this;
    layer.center();
    layer.on("change:orientation", (function(_this) {
      return function(newValue, layer) {
        return _this.updatePosition(layer);
      };
    })(this));
    this.updatePosition(layer);
    layer._context.on("layer:destroy", (function(_this) {
      return function(layer) {
        if (layer === _this.layer) {
          return _this.destroy();
        }
      };
    })(this));
  }

  VRAnchorLayer.prototype.updatePosition = function(layer) {
    var halfCubeSide;
    halfCubeSide = this.cubeSide / 2;
    this.midX = halfCubeSide;
    this.midY = halfCubeSide;
    this.z = -layer.distance;
    this.originZ = layer.distance;
    this.rotationX = -90 - layer.elevation;
    return this.rotationY = -layer.heading;
  };

  return VRAnchorLayer;

})(Layer);

exports.VRLayer = (function(superClass) {
  extend(VRLayer, superClass);

  function VRLayer(options) {
    if (options == null) {
      options = {};
    }
    options = _.defaults(options, {
      heading: 0,
      elevation: 0
    });
    VRLayer.__super__.constructor.call(this, options);
  }

  VRLayer.define("heading", {
    get: function() {
      return this._heading;
    },
    set: function(value) {
      var rest, roundedValue;
      if (value >= 360) {
        value = value % 360;
      } else if (value < 0) {
        rest = Math.abs(value) % 360;
        value = 360 - rest;
      }
      roundedValue = Math.round(value * 1000) / 1000;
      if (this._heading !== roundedValue) {
        this._heading = roundedValue;
        this.emit("change:heading", this._heading);
        return this.emit("change:orientation", this._heading);
      }
    }
  });

  VRLayer.define("elevation", {
    get: function() {
      return this._elevation;
    },
    set: function(value) {
      var roundedValue;
      value = Utils.clamp(value, -90, 90);
      roundedValue = Math.round(value * 1000) / 1000;
      if (roundedValue !== this._elevation) {
        this._elevation = roundedValue;
        this.emit("change:elevation", roundedValue);
        return this.emit("change:orientation", roundedValue);
      }
    }
  });

  VRLayer.define("distance", {
    get: function() {
      return this._distance;
    },
    set: function(value) {
      if (value !== this._distance) {
        this._distance = value;
        this.emit("change:distance", value);
        return this.emit("change:orientation", value);
      }
    }
  });

  return VRLayer;

})(Layer);

exports.VRComponent = (function(superClass) {
  extend(VRComponent, superClass);

  function VRComponent(options) {
    if (options == null) {
      options = {};
    }
    this._emitOrientationDidChangeEvent = bind(this._emitOrientationDidChangeEvent, this);
    this.setupPan = bind(this.setupPan, this);
    this._canvasToComponentRatio = bind(this._canvasToComponentRatio, this);
    this.deviceOrientationUpdate = bind(this.deviceOrientationUpdate, this);
    this.createCube = bind(this.createCube, this);
    this.setupDefaultValues = bind(this.setupDefaultValues, this);
    options = _.defaults(options, {
      cubeSide: 3000,
      perspective: 1200,
      lookAtLatestProjectedLayer: false,
      width: Screen.width,
      height: Screen.height,
      arrowKeys: true,
      panning: true,
      mobilePanning: true,
      flat: true,
      clip: true
    });
    VRComponent.__super__.constructor.call(this, options);
    Screen.backgroundColor = "black";
    Screen.perspective = 0;
    this.setupDefaultValues();
    this.degToRad = Math.PI / 180;
    this.backgroundColor = null;
    this.createCube(options.cubeSide);
    this.lookAtLatestProjectedLayer = options.lookAtLatestProjectedLayer;
    this.setupKeys(options.arrowKeys);
    if (options.heading != null) {
      this.heading = options.heading;
    }
    if (options.elevation != null) {
      this.elevation = options.elevation;
    }
    this.setupPan(options.panning);
    this.mobilePanning = options.mobilePanning;
    if (Utils.isMobile()) {
      window.addEventListener("deviceorientation", (function(_this) {
        return function(event) {
          return _this.orientationData = event;
        };
      })(this));
    }
    Framer.Loop.on("update", this.deviceOrientationUpdate);
    Framer.CurrentContext.on("reset", function() {
      return Framer.Loop.off("update", this.deviceOrientationUpdate);
    });
    this.on("change:frame", function() {
      return this.desktopPan(0, 0);
    });
  }

  VRComponent.prototype.setupDefaultValues = function() {
    this._heading = 0;
    this._elevation = 0;
    this._tilt = 0;
    this._headingOffset = 0;
    this._elevationOffset = 0;
    this._deviceHeading = 0;
    return this._deviceElevation = 0;
  };

  VRComponent.prototype.setupKeys = function(enabled) {
    this.arrowKeys = enabled;
    document.addEventListener("keydown", (function(_this) {
      return function(event) {
        switch (event.which) {
          case KEYS.UpArrow:
            KEYSDOWN.up = true;
            return event.preventDefault();
          case KEYS.DownArrow:
            KEYSDOWN.down = true;
            return event.preventDefault();
          case KEYS.LeftArrow:
            KEYSDOWN.left = true;
            return event.preventDefault();
          case KEYS.RightArrow:
            KEYSDOWN.right = true;
            return event.preventDefault();
        }
      };
    })(this));
    document.addEventListener("keyup", (function(_this) {
      return function(event) {
        switch (event.which) {
          case KEYS.UpArrow:
            KEYSDOWN.up = false;
            return event.preventDefault();
          case KEYS.DownArrow:
            KEYSDOWN.down = false;
            return event.preventDefault();
          case KEYS.LeftArrow:
            KEYSDOWN.left = false;
            return event.preventDefault();
          case KEYS.RightArrow:
            KEYSDOWN.right = false;
            return event.preventDefault();
        }
      };
    })(this));
    return window.onblur = function() {
      KEYSDOWN.up = false;
      KEYSDOWN.down = false;
      KEYSDOWN.left = false;
      return KEYSDOWN.right = false;
    };
  };

  VRComponent.define("heading", {
    get: function() {
      var heading, rest;
      heading = this._heading + this._headingOffset;
      if (heading > 360) {
        heading = heading % 360;
      } else if (heading < 0) {
        rest = Math.abs(heading) % 360;
        heading = 360 - rest;
      }
      return Math.round(heading * 1000) / 1000;
    },
    set: function(value) {
      return this.lookAt(value, this._elevation);
    }
  });

  VRComponent.define("elevation", {
    get: function() {
      return Math.round(this._elevation * 1000) / 1000;
    },
    set: function(value) {
      value = Utils.clamp(value, -90, 90);
      return this.lookAt(this._heading, value);
    }
  });

  VRComponent.define("tilt", {
    get: function() {
      return this._tilt;
    },
    set: function(value) {
      throw "Tilt is readonly";
    }
  });

  SIDES.map(function(face) {
    return VRComponent.define(face, {
      get: function() {
        return this.layerFromFace(face);
      },
      set: function(value) {
        return this.setImage(face, value);
      }
    });
  });

  VRComponent.prototype.createCube = function(cubeSide) {
    var colors, halfCubeSide, i, key, ref, results, rotationX, rotationY, side, sideIndex, sideNames;
    if (cubeSide == null) {
      cubeSide = this.cubeSide;
    }
    this.cubeSide = cubeSide;
    if ((ref = this.world) != null) {
      ref.destroy();
    }
    this.world = new Layer({
      name: "world",
      superLayer: this,
      size: cubeSide,
      backgroundColor: null,
      clip: false
    });
    this.world.center();
    this.sides = [];
    halfCubeSide = this.cubeSide / 2;
    colors = ["#866ccc", "#28affa", "#2dd7aa", "#ffc22c", "#7ddd11", "#f95faa"];
    sideNames = ["front", "right", "back", "left", "top", "bottom"];
    for (sideIndex = i = 0; i < 6; sideIndex = ++i) {
      rotationX = 0;
      if (indexOf.call([0, 1, 2, 3], sideIndex) >= 0) {
        rotationX = -90;
      }
      if (sideIndex === 4) {
        rotationX = 180;
      }
      rotationY = 0;
      if (indexOf.call([0, 1, 2, 3], sideIndex) >= 0) {
        rotationY = sideIndex * -90;
      }
      side = new Layer({
        size: cubeSide,
        z: -halfCubeSide,
        originZ: halfCubeSide,
        rotationX: rotationX,
        rotationY: rotationY,
        parent: this.world,
        name: sideNames[sideIndex],
        html: sideNames[sideIndex],
        color: "white",
        backgroundColor: colors[sideIndex],
        style: {
          lineHeight: cubeSide + "px",
          textAlign: "center",
          fontSize: (cubeSide / 10) + "px",
          fontWeight: "100",
          fontFamily: "Helvetica Neue"
        }
      });
      this.sides.push(side);
      side._backgroundColor = side.backgroundColor;
    }
    results = [];
    for (key in this.sideImages) {
      if (this.sideImages != null) {
        results.push(this.setImage(key, this.sideImages[key]));
      }
    }
    return results;
  };

  VRComponent.prototype.hideEnviroment = function() {
    var i, len, ref, results, side;
    ref = this.sides;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      side = ref[i];
      results.push(side.destroy());
    }
    return results;
  };

  VRComponent.prototype.layerFromFace = function(face) {
    var map;
    if (this.sides == null) {
      return;
    }
    map = {
      north: this.sides[0],
      front: this.sides[0],
      east: this.sides[1],
      right: this.sides[1],
      south: this.sides[2],
      back: this.sides[2],
      west: this.sides[3],
      left: this.sides[3],
      top: this.sides[4],
      bottom: this.sides[5]
    };
    return map[face];
  };

  VRComponent.prototype.setImage = function(face, imagePath) {
    var layer;
    if (indexOf.call(SIDES, face) < 0) {
      throw Error("VRComponent setImage, wrong name for face: " + face + ", valid options: front, right, back, left, top, bottom, north, east, south, west");
    }
    if (this.sideImages == null) {
      this.sideImages = {};
    }
    this.sideImages[face] = imagePath;
    layer = this.layerFromFace(face);
    if (imagePath != null) {
      if (layer != null) {
        layer.html = "";
      }
      return layer != null ? layer.image = imagePath : void 0;
    } else {
      if (layer != null) {
        layer.html = layer != null ? layer.name : void 0;
      }
      return layer != null ? layer.backgroundColor = layer != null ? layer._backgroundColor : void 0 : void 0;
    }
  };

  VRComponent.prototype.getImage = function(face) {
    var layer;
    if (indexOf.call(SIDES, face) < 0) {
      throw Error("VRComponent getImage, wrong name for face: " + face + ", valid options: front, right, back, left, top, bottom, north, east, south, west");
    }
    layer = this.layerFromFace(face);
    if (layer != null) {
      return layer.image;
    }
  };

  VRComponent.prototype.projectLayer = function(insertLayer) {
    var anchor, distance, elevation, heading, rest;
    heading = insertLayer.heading;
    if (heading == null) {
      heading = 0;
    }
    if (heading >= 360) {
      heading = value % 360;
    } else if (heading < 0) {
      rest = Math.abs(heading) % 360;
      heading = 360 - rest;
    }
    elevation = insertLayer.elevation;
    if (elevation == null) {
      elevation = 0;
    }
    elevation = Utils.clamp(elevation, -90, 90);
    distance = insertLayer.distance;
    if (distance == null) {
      distance = 1200;
    }
    insertLayer.heading = heading;
    insertLayer.elevation = elevation;
    insertLayer.distance = distance;
    anchor = new VRAnchorLayer(insertLayer, this.cubeSide);
    anchor.superLayer = this.world;
    if (this.lookAtLatestProjectedLayer) {
      return this.lookAt(heading, elevation);
    }
  };

  VRComponent.prototype.deviceOrientationUpdate = function() {
    var alpha, beta, date, diff, gamma, x;
    if (Utils.isDesktop()) {
      if (this.arrowKeys) {
        if (this._lastCallHorizontal === void 0) {
          this._lastCallHorizontal = 0;
          this._lastCallVertical = 0;
          this._accelerationHorizontal = 1;
          this._accelerationVertical = 1;
          this._goingUp = false;
          this._goingLeft = false;
        }
        date = new Date();
        x = .1;
        if (KEYSDOWN.up || KEYSDOWN.down) {
          diff = date - this._lastCallVertical;
          if (diff < 30) {
            if (this._accelerationVertical < 30) {
              this._accelerationVertical += 0.18;
            }
          }
          if (KEYSDOWN.up) {
            if (this._goingUp === false) {
              this._accelerationVertical = 1;
              this._goingUp = true;
            }
            this.desktopPan(0, 1 * this._accelerationVertical * x);
          } else {
            if (this._goingUp === true) {
              this._accelerationVertical = 1;
              this._goingUp = false;
            }
            this.desktopPan(0, -1 * this._accelerationVertical * x);
          }
          this._lastCallVertical = date;
        } else {
          this._accelerationVertical = 1;
        }
        if (KEYSDOWN.left || KEYSDOWN.right) {
          diff = date - this._lastCallHorizontal;
          if (diff < 30) {
            if (this._accelerationHorizontal < 25) {
              this._accelerationHorizontal += 0.18;
            }
          }
          if (KEYSDOWN.left) {
            if (this._goingLeft === false) {
              this._accelerationHorizontal = 1;
              this._goingLeft = true;
            }
            this.desktopPan(1 * this._accelerationHorizontal * x, 0);
          } else {
            if (this._goingLeft === true) {
              this._accelerationHorizontal = 1;
              this._goingLeft = false;
            }
            this.desktopPan(-1 * this._accelerationHorizontal * x, 0);
          }
          return this._lastCallHorizontal = date;
        } else {
          return this._accelerationHorizontal = 1;
        }
      }
    } else if (this.orientationData != null) {
      alpha = this.orientationData.alpha;
      beta = this.orientationData.beta;
      gamma = this.orientationData.gamma;
      if (alpha !== 0 && beta !== 0 && gamma !== 0) {
        this.directionParams(alpha, beta, gamma);
      }
      this.world.midX = this.midX;
      this.world.midY = this.midY;
      this.world.z = this.perspective;
      this.world.rotation = -this._heading - this._headingOffset;
      this.world.rotationX = 90 + this._elevation;
      return this.world.rotationY = this._tilt;
    }
  };

  VRComponent.prototype.directionParams = function(alpha, beta, gamma) {
    var alphaRad, betaRad, cA, cB, cG, cH, elevation, gammaRad, heading, orientationTiltOffset, sA, sB, sG, tilt, xrA, xrB, xrC, yrA, yrB, yrC, zrA, zrB, zrC;
    alphaRad = alpha * this.degToRad;
    betaRad = beta * this.degToRad;
    gammaRad = gamma * this.degToRad;
    cA = Math.cos(alphaRad);
    sA = Math.sin(alphaRad);
    cB = Math.cos(betaRad);
    sB = Math.sin(betaRad);
    cG = Math.cos(gammaRad);
    sG = Math.sin(gammaRad);
    xrA = -sA * sB * sG + cA * cG;
    xrB = cA * sB * sG + sA * cG;
    xrC = cB * sG;
    yrA = -sA * cB;
    yrB = cA * cB;
    yrC = -sB;
    zrA = -sA * sB * cG - cA * sG;
    zrB = cA * sB * cG - sA * sG;
    zrC = cB * cG;
    heading = Math.atan(zrA / zrB);
    if (zrB < 0) {
      heading += Math.PI;
    } else if (zrA < 0) {
      heading += 2 * Math.PI;
    }
    elevation = Math.PI / 2 - Math.acos(-zrC);
    cH = Math.sqrt(1 - (zrC * zrC));
    tilt = Math.acos(-xrC / cH) * Math.sign(yrC);
    heading *= 180 / Math.PI;
    elevation *= 180 / Math.PI;
    tilt *= 180 / Math.PI;
    this._heading = Math.round(heading * 1000) / 1000;
    this._elevation = Math.round(elevation * 1000) / 1000;
    tilt = Math.round(tilt * 1000) / 1000;
    orientationTiltOffset = (window.orientation * -1) + 90;
    tilt += orientationTiltOffset;
    if (tilt > 180) {
      tilt -= 360;
    }
    this._tilt = tilt;
    this._deviceHeading = this._heading;
    this._deviceElevation = this._elevation;
    return this._emitOrientationDidChangeEvent();
  };

  VRComponent.prototype._canvasToComponentRatio = function() {
    var pointA, pointB, xDist, yDist;
    pointA = Utils.convertPointFromContext({
      x: 0,
      y: 0
    }, this, true);
    pointB = Utils.convertPointFromContext({
      x: 1,
      y: 1
    }, this, true);
    xDist = Math.abs(pointA.x - pointB.x);
    yDist = Math.abs(pointA.y - pointB.y);
    return {
      x: xDist,
      y: yDist
    };
  };

  VRComponent.prototype.setupPan = function(enabled) {
    this.panning = enabled;
    this.desktopPan(0, 0);
    this.onMouseDown((function(_this) {
      return function() {
        return _this.animateStop();
      };
    })(this));
    this.onPan((function(_this) {
      return function(data) {
        var deltaX, deltaY, ratio, strength;
        if (!_this.panning) {
          return;
        }
        ratio = _this._canvasToComponentRatio();
        deltaX = data.deltaX * ratio.x;
        deltaY = data.deltaY * ratio.y;
        strength = Utils.modulate(_this.perspective, [1200, 900], [22, 17.5]);
        if (Utils.isMobile()) {
          if (_this.mobilePanning) {
            _this._headingOffset -= deltaX / strength;
          }
        } else {
          _this.desktopPan(deltaX / strength, deltaY / strength);
        }
        _this._prevVeloX = data.velocityX;
        return _this._prevVeloU = data.velocityY;
      };
    })(this));
    return this.onPanEnd((function(_this) {
      return function(data) {
        var ratio, strength, velo, velocityX, velocityY;
        if (!_this.panning || Utils.isMobile()) {
          return;
        }
        ratio = _this._canvasToComponentRatio();
        velocityX = (data.velocityX + _this._prevVeloX) * 0.5;
        velocityY = (data.velocityY + _this._prevVeloY) * 0.5;
        velocityX *= velocityX;
        velocityY *= velocityY;
        velocityX *= ratio.x;
        velocityY *= ratio.y;
        strength = Utils.modulate(_this.perspective, [1200, 900], [22, 17.5]);
        velo = Math.floor(Math.sqrt(velocityX + velocityY) * 5) / strength;
        return _this.animate({
          properties: {
            heading: _this.heading - (data.velocityX * ratio.x * 200) / strength,
            elevation: _this.elevation + (data.velocityY * ratio.y * 200) / strength
          },
          curve: "spring(300, 100, " + velo + ")"
        });
      };
    })(this));
  };

  VRComponent.prototype.desktopPan = function(deltaDir, deltaHeight) {
    var halfCubeSide;
    halfCubeSide = this.cubeSide / 2;
    this._heading -= deltaDir;
    if (this._heading > 360) {
      this._heading -= 360;
    } else if (this._heading < 0) {
      this._heading += 360;
    }
    this._elevation += deltaHeight;
    this._elevation = Utils.clamp(this._elevation, -90, 90);
    this.world.midX = this.midX;
    this.world.midY = this.midY;
    this.world.z = this.perspective;
    this.world.rotationX = 90 + this._elevation;
    this.world.rotation = -this._heading - this._headingOffset;
    return this._emitOrientationDidChangeEvent();
  };

  VRComponent.prototype.lookAt = function(heading, elevation) {
    this.world.midX = this.midX;
    this.world.midY = this.midY;
    this.world.z = this.perspective;
    this.world.rotationX = 90 + this._elevation;
    this.world.rotation = -this._heading;
    this.world.rotationY = this._tilt;
    this._heading = heading;
    this._elevation = elevation;
    if (Utils.isMobile()) {
      this._headingOffset = this._heading - this._deviceHeading;
    }
    this._elevationOffset = this._elevation - this._deviceElevation;
    heading = this._heading;
    if (heading < 0) {
      heading += 360;
    } else if (heading > 360) {
      heading -= 360;
    }
    return this._emitOrientationDidChangeEvent();
  };

  VRComponent.prototype._emitOrientationDidChangeEvent = function() {
    return this.emit(Events.OrientationDidChange, {
      heading: this.heading,
      elevation: this.elevation,
      tilt: this.tilt
    });
  };

  VRComponent.prototype.onOrientationChange = function(cb) {
    return this.on(Events.OrientationDidChange, cb);
  };

  return VRComponent;

})(Layer);


},{}],"myModule":[function(require,module,exports){
exports.myVar = "myVariable";

exports.myFunction = function() {
  return print("myFunction is running");
};

exports.myArray = [1, 2, 3];


},{}]},{},[])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWVyLm1vZHVsZXMuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL1VzZXJzL2RhbmllbC9Eb2N1bWVudHMvVVgvUHJvdG90eXBlcy9GcmFtZXIvVnIuZnJhbWVyL21vZHVsZXMvbXlNb2R1bGUuY29mZmVlIiwiLi4vLi4vLi4vLi4vLi4vVXNlcnMvZGFuaWVsL0RvY3VtZW50cy9VWC9Qcm90b3R5cGVzL0ZyYW1lci9Wci5mcmFtZXIvbW9kdWxlcy9WUkNvbXBvbmVudC5jb2ZmZWUiLCJub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIiMgQWRkIHRoZSBmb2xsb3dpbmcgbGluZSB0byB5b3VyIHByb2plY3QgaW4gRnJhbWVyIFN0dWRpby4gXG4jIG15TW9kdWxlID0gcmVxdWlyZSBcIm15TW9kdWxlXCJcbiMgUmVmZXJlbmNlIHRoZSBjb250ZW50cyBieSBuYW1lLCBsaWtlIG15TW9kdWxlLm15RnVuY3Rpb24oKSBvciBteU1vZHVsZS5teVZhclxuXG5leHBvcnRzLm15VmFyID0gXCJteVZhcmlhYmxlXCJcblxuZXhwb3J0cy5teUZ1bmN0aW9uID0gLT5cblx0cHJpbnQgXCJteUZ1bmN0aW9uIGlzIHJ1bm5pbmdcIlxuXG5leHBvcnRzLm15QXJyYXkgPSBbMSwgMiwgM10iLCJcIlwiXCJcblxuVlJDb21wb25lbnQgY2xhc3NcblxucHJvcGVydGllc1xuLSBmcm9udCAoc2V0OiBpbWFnZVBhdGggPHN0cmluZz4sIGdldDogbGF5ZXIpXG4tIHJpZ2h0XG4tIGJhY2tcbi0gbGVmdFxuLSB0b3Bcbi0gYm90dG9tXG4tIGhlYWRpbmcgPG51bWJlcj5cbi0gZWxldmF0aW9uIDxudW1iZXI+XG4tIHRpbHQgPG51bWJlcj4gcmVhZG9ubHlcblxuLSBwYW5uaW5nIDxib29sPlxuLSBtb2JpbGVQYW5uaW5nIDxib29sPlxuLSBhcnJvd0tleXMgPGJvb2w+XG5cbi0gbG9va0F0TGF0ZXN0UHJvamVjdGVkTGF5ZXIgPGJvb2w+XG5cbm1ldGhvZHNcbi0gcHJvamVjdExheWVyKGxheWVyKSAjIGhlYWRpbmcgYW5kIGVsZXZhdGlvbiBhcmUgc2V0IGFzIHByb3BlcnRpZXMgb24gdGhlIGxheWVyXG4tIGhpZGVFbnZpcm9tZW50KClcblxuZXZlbnRzXG4tIG9uT3JpZW50YXRpb25DaGFuZ2UgKGRhdGEge2hlYWRpbmcsIGVsZXZhdGlvbiwgdGlsdH0pXG5cbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblZSTGF5ZXIgY2xhc3NcblxucHJvcGVydGllc1xuLSBoZWFkaW5nIDxudW1iZXI+IChmcm9tIDAgdXAgdG8gMzYwKVxuLSBlbGV2YXRpb24gPG51bWJlcj4gKGZyb20gLTkwIGRvd24gdG8gOTAgdXApXG5cblwiXCJcIlxuXG5TSURFUyA9IFtcblx0XCJub3J0aFwiLFxuXHRcImZyb250XCIsXG5cdFwiZWFzdFwiLFxuXHRcInJpZ2h0XCIsXG5cdFwic291dGhcIixcblx0XCJiYWNrXCIsXG5cdFwid2VzdFwiLFxuXHRcImxlZnRcIixcblx0XCJ0b3BcIixcblx0XCJib3R0b21cIixcbl1cblxuS0VZUyA9IHtcblx0TGVmdEFycm93OiAzN1xuXHRVcEFycm93OiAzOFxuXHRSaWdodEFycm93OiAzOVxuXHREb3duQXJyb3c6IDQwXG59XG5cbktFWVNET1dOID0ge1xuXHRsZWZ0OiBmYWxzZVxuXHR1cDogZmFsc2Vcblx0cmlnaHQ6IGZhbHNlXG5cdGRvd246IGZhbHNlXG59XG5cbkV2ZW50cy5PcmllbnRhdGlvbkRpZENoYW5nZSA9IFwib3JpZW50YXRpb25kaWRjaGFuZ2VcIlxuXG5jbGFzcyBWUkFuY2hvckxheWVyIGV4dGVuZHMgTGF5ZXJcblxuXHRjb25zdHJ1Y3RvcjogKGxheWVyLCBjdWJlU2lkZSkgLT5cblx0XHRzdXBlcigpXG5cdFx0QHdpZHRoID0gMlxuXHRcdEBoZWlnaHQgPSAyXG5cdFx0QGNsaXAgPSBmYWxzZVxuXHRcdEBuYW1lID0gXCJhbmNob3JcIlxuXHRcdEBjdWJlU2lkZSA9IGN1YmVTaWRlXG5cdFx0QGJhY2tncm91bmRDb2xvciA9IG51bGxcblxuXHRcdEBsYXllciA9IGxheWVyXG5cdFx0bGF5ZXIucGFyZW50ID0gQFxuXHRcdGxheWVyLmNlbnRlcigpXG5cblx0XHRsYXllci5vbiBcImNoYW5nZTpvcmllbnRhdGlvblwiLCAobmV3VmFsdWUsIGxheWVyKSA9PiBAdXBkYXRlUG9zaXRpb24obGF5ZXIpXG5cdFx0QHVwZGF0ZVBvc2l0aW9uKGxheWVyKVxuXG5cdFx0bGF5ZXIuX2NvbnRleHQub24gXCJsYXllcjpkZXN0cm95XCIsIChsYXllcikgPT4gQGRlc3Ryb3koKSBpZiBsYXllciBpcyBAbGF5ZXJcblxuXHR1cGRhdGVQb3NpdGlvbjogKGxheWVyKSAtPlxuXHRcdGhhbGZDdWJlU2lkZSA9IEBjdWJlU2lkZSAvIDJcblx0XHRAbWlkWCA9IGhhbGZDdWJlU2lkZVxuXHRcdEBtaWRZID0gaGFsZkN1YmVTaWRlXG5cdFx0QHogPSAtIGxheWVyLmRpc3RhbmNlXG5cdFx0QG9yaWdpblogPSBsYXllci5kaXN0YW5jZVxuXHRcdEByb3RhdGlvblggPSAtOTAgLSBsYXllci5lbGV2YXRpb25cblx0XHRAcm90YXRpb25ZID0gLWxheWVyLmhlYWRpbmdcblxuY2xhc3MgZXhwb3J0cy5WUkxheWVyIGV4dGVuZHMgTGF5ZXJcblxuXHRjb25zdHJ1Y3RvcjogKG9wdGlvbnMgPSB7fSkgLT5cblx0XHRvcHRpb25zID0gXy5kZWZhdWx0cyBvcHRpb25zLFxuXHRcdFx0aGVhZGluZzogMFxuXHRcdFx0ZWxldmF0aW9uOiAwXG5cdFx0c3VwZXIgb3B0aW9uc1xuXG5cdEBkZWZpbmUgXCJoZWFkaW5nXCIsXG5cdFx0Z2V0OiAtPiBAX2hlYWRpbmdcblx0XHRzZXQ6ICh2YWx1ZSkgLT5cblx0XHRcdGlmIHZhbHVlID49IDM2MFxuXHRcdFx0XHR2YWx1ZSA9IHZhbHVlICUgMzYwXG5cdFx0XHRlbHNlIGlmIHZhbHVlIDwgMFxuXHRcdFx0XHRyZXN0ID0gTWF0aC5hYnModmFsdWUpICUgMzYwXG5cdFx0XHRcdHZhbHVlID0gMzYwIC0gcmVzdFxuXHRcdFx0cm91bmRlZFZhbHVlID0gTWF0aC5yb3VuZCh2YWx1ZSAqIDEwMDApIC8gMTAwMFxuXHRcdFx0aWYgQF9oZWFkaW5nIGlzbnQgcm91bmRlZFZhbHVlXG5cdFx0XHRcdEBfaGVhZGluZyA9IHJvdW5kZWRWYWx1ZVxuXHRcdFx0XHRAZW1pdChcImNoYW5nZTpoZWFkaW5nXCIsIEBfaGVhZGluZylcblx0XHRcdFx0QGVtaXQoXCJjaGFuZ2U6b3JpZW50YXRpb25cIiwgQF9oZWFkaW5nKVxuXG5cdEBkZWZpbmUgXCJlbGV2YXRpb25cIixcblx0XHRnZXQ6IC0+IEBfZWxldmF0aW9uXG5cdFx0c2V0OiAodmFsdWUpIC0+XG5cdFx0XHR2YWx1ZSA9IFV0aWxzLmNsYW1wKHZhbHVlLCAtOTAsIDkwKVxuXHRcdFx0cm91bmRlZFZhbHVlID0gTWF0aC5yb3VuZCh2YWx1ZSAqIDEwMDApIC8gMTAwMFxuXHRcdFx0aWYgcm91bmRlZFZhbHVlIGlzbnQgQF9lbGV2YXRpb25cblx0XHRcdFx0QF9lbGV2YXRpb24gPSByb3VuZGVkVmFsdWVcblx0XHRcdFx0QGVtaXQoXCJjaGFuZ2U6ZWxldmF0aW9uXCIsIHJvdW5kZWRWYWx1ZSlcblx0XHRcdFx0QGVtaXQoXCJjaGFuZ2U6b3JpZW50YXRpb25cIiwgcm91bmRlZFZhbHVlKVxuXG5cdEBkZWZpbmUgXCJkaXN0YW5jZVwiLFxuXHRcdGdldDogLT4gQF9kaXN0YW5jZVxuXHRcdHNldDogKHZhbHVlKSAtPlxuXHRcdFx0aWYgdmFsdWUgaXNudCBAX2Rpc3RhbmNlXG5cdFx0XHRcdEBfZGlzdGFuY2UgPSB2YWx1ZVxuXHRcdFx0XHRAZW1pdChcImNoYW5nZTpkaXN0YW5jZVwiLCB2YWx1ZSlcblx0XHRcdFx0QGVtaXQoXCJjaGFuZ2U6b3JpZW50YXRpb25cIiwgdmFsdWUpXG5cbmNsYXNzIGV4cG9ydHMuVlJDb21wb25lbnQgZXh0ZW5kcyBMYXllclxuXG5cdGNvbnN0cnVjdG9yOiAob3B0aW9ucyA9IHt9KSAtPlxuXHRcdG9wdGlvbnMgPSBfLmRlZmF1bHRzIG9wdGlvbnMsXG5cdFx0XHRjdWJlU2lkZTogMzAwMFxuXHRcdFx0cGVyc3BlY3RpdmU6IDEyMDBcblx0XHRcdGxvb2tBdExhdGVzdFByb2plY3RlZExheWVyOiBmYWxzZVxuXHRcdFx0d2lkdGg6IFNjcmVlbi53aWR0aFxuXHRcdFx0aGVpZ2h0OiBTY3JlZW4uaGVpZ2h0XG5cdFx0XHRhcnJvd0tleXM6IHRydWVcblx0XHRcdHBhbm5pbmc6IHRydWVcblx0XHRcdG1vYmlsZVBhbm5pbmc6IHRydWVcblx0XHRcdGZsYXQ6IHRydWVcblx0XHRcdGNsaXA6IHRydWVcblx0XHRzdXBlciBvcHRpb25zXG5cblx0XHQjIHRvIGhpZGUgdGhlIHNlZW1zIHdoZXJlIHRoZSBjdWJlIHN1cmZhY2VzIGNvbWUgdG9nZXRoZXIgd2UgZGlzYWJsZSB0aGUgdmlld3BvcnQgcGVyc3BlY3RpdmUgYW5kIHNldCBhIGJsYWNrIGJhY2tncm91bmRcblx0XHRTY3JlZW4uYmFja2dyb3VuZENvbG9yID0gXCJibGFja1wiXG5cdFx0U2NyZWVuLnBlcnNwZWN0aXZlID0gMFxuXG5cdFx0QHNldHVwRGVmYXVsdFZhbHVlcygpXG5cdFx0QGRlZ1RvUmFkID0gTWF0aC5QSSAvIDE4MFxuXHRcdEBiYWNrZ3JvdW5kQ29sb3IgPSBudWxsXG5cblx0XHRAY3JlYXRlQ3ViZShvcHRpb25zLmN1YmVTaWRlKVxuXHRcdEBsb29rQXRMYXRlc3RQcm9qZWN0ZWRMYXllciA9IG9wdGlvbnMubG9va0F0TGF0ZXN0UHJvamVjdGVkTGF5ZXJcblx0XHRAc2V0dXBLZXlzKG9wdGlvbnMuYXJyb3dLZXlzKVxuXG5cdFx0QGhlYWRpbmcgPSBvcHRpb25zLmhlYWRpbmcgaWYgb3B0aW9ucy5oZWFkaW5nP1xuXHRcdEBlbGV2YXRpb24gPSBvcHRpb25zLmVsZXZhdGlvbiBpZiBvcHRpb25zLmVsZXZhdGlvbj9cblxuXHRcdEBzZXR1cFBhbihvcHRpb25zLnBhbm5pbmcpXG5cdFx0QG1vYmlsZVBhbm5pbmcgPSBvcHRpb25zLm1vYmlsZVBhbm5pbmdcblxuXHRcdGlmIFV0aWxzLmlzTW9iaWxlKClcblx0XHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyIFwiZGV2aWNlb3JpZW50YXRpb25cIiwgKGV2ZW50KSA9PiBAb3JpZW50YXRpb25EYXRhID0gZXZlbnRcblxuXHRcdEZyYW1lci5Mb29wLm9uKFwidXBkYXRlXCIsIEBkZXZpY2VPcmllbnRhdGlvblVwZGF0ZSlcblxuXHRcdCMgTWFrZSBzdXJlIHdlIHJlbW92ZSB0aGUgdXBkYXRlIGZyb20gdGhlIGxvb3Agd2hlbiB3ZSBkZXN0cm95IHRoZSBjb250ZXh0XG5cdFx0RnJhbWVyLkN1cnJlbnRDb250ZXh0Lm9uIFwicmVzZXRcIiwgLT4gRnJhbWVyLkxvb3Aub2ZmKFwidXBkYXRlXCIsIEBkZXZpY2VPcmllbnRhdGlvblVwZGF0ZSlcblxuXHRcdEBvbiBcImNoYW5nZTpmcmFtZVwiLCAtPiBAZGVza3RvcFBhbigwLDApXG5cblx0c2V0dXBEZWZhdWx0VmFsdWVzOiA9PlxuXG5cdFx0QF9oZWFkaW5nID0gMFxuXHRcdEBfZWxldmF0aW9uID0gMFxuXHRcdEBfdGlsdCA9IDBcblxuXHRcdEBfaGVhZGluZ09mZnNldCA9IDBcblx0XHRAX2VsZXZhdGlvbk9mZnNldCA9IDBcblx0XHRAX2RldmljZUhlYWRpbmcgPSAwXG5cdFx0QF9kZXZpY2VFbGV2YXRpb24gPSAwXG5cblx0c2V0dXBLZXlzOiAoZW5hYmxlZCkgLT5cblxuXHRcdEBhcnJvd0tleXMgPSBlbmFibGVkXG5cblx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyIFwia2V5ZG93blwiLCAoZXZlbnQpID0+XG5cdFx0XHRzd2l0Y2ggZXZlbnQud2hpY2hcblx0XHRcdFx0d2hlbiBLRVlTLlVwQXJyb3dcblx0XHRcdFx0XHRLRVlTRE9XTi51cCA9IHRydWVcblx0XHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpXG5cdFx0XHRcdHdoZW4gS0VZUy5Eb3duQXJyb3dcblx0XHRcdFx0XHRLRVlTRE9XTi5kb3duID0gdHJ1ZVxuXHRcdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KClcblx0XHRcdFx0d2hlbiBLRVlTLkxlZnRBcnJvd1xuXHRcdFx0XHRcdEtFWVNET1dOLmxlZnQgPSB0cnVlXG5cdFx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKVxuXHRcdFx0XHR3aGVuIEtFWVMuUmlnaHRBcnJvd1xuXHRcdFx0XHRcdEtFWVNET1dOLnJpZ2h0ID0gdHJ1ZVxuXHRcdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KClcblxuXHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIgXCJrZXl1cFwiLCAoZXZlbnQpID0+XG5cdFx0XHRzd2l0Y2ggZXZlbnQud2hpY2hcblx0XHRcdFx0d2hlbiBLRVlTLlVwQXJyb3dcblx0XHRcdFx0XHRLRVlTRE9XTi51cCA9IGZhbHNlXG5cdFx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKVxuXHRcdFx0XHR3aGVuIEtFWVMuRG93bkFycm93XG5cdFx0XHRcdFx0S0VZU0RPV04uZG93biA9IGZhbHNlXG5cdFx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKVxuXHRcdFx0XHR3aGVuIEtFWVMuTGVmdEFycm93XG5cdFx0XHRcdFx0S0VZU0RPV04ubGVmdCA9IGZhbHNlXG5cdFx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKVxuXHRcdFx0XHR3aGVuIEtFWVMuUmlnaHRBcnJvd1xuXHRcdFx0XHRcdEtFWVNET1dOLnJpZ2h0ID0gZmFsc2Vcblx0XHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpXG5cblx0XHR3aW5kb3cub25ibHVyID0gLT5cblx0XHRcdEtFWVNET1dOLnVwID0gZmFsc2Vcblx0XHRcdEtFWVNET1dOLmRvd24gPSBmYWxzZVxuXHRcdFx0S0VZU0RPV04ubGVmdCA9IGZhbHNlXG5cdFx0XHRLRVlTRE9XTi5yaWdodCA9IGZhbHNlXG5cblx0QGRlZmluZSBcImhlYWRpbmdcIixcblx0XHRnZXQ6IC0+XG5cdFx0XHRoZWFkaW5nID0gQF9oZWFkaW5nICsgQF9oZWFkaW5nT2Zmc2V0XG5cdFx0XHRpZiBoZWFkaW5nID4gMzYwXG5cdFx0XHRcdGhlYWRpbmcgPSBoZWFkaW5nICUgMzYwXG5cdFx0XHRlbHNlIGlmIGhlYWRpbmcgPCAwXG5cdFx0XHRcdHJlc3QgPSBNYXRoLmFicyhoZWFkaW5nKSAlIDM2MFxuXHRcdFx0XHRoZWFkaW5nID0gMzYwIC0gcmVzdFxuXHRcdFx0cmV0dXJuIE1hdGgucm91bmQoaGVhZGluZyAqIDEwMDApIC8gMTAwMFxuXHRcdHNldDogKHZhbHVlKSAtPlxuXHRcdFx0QGxvb2tBdCh2YWx1ZSwgQF9lbGV2YXRpb24pXG5cblx0QGRlZmluZSBcImVsZXZhdGlvblwiLFxuXHRcdGdldDogLT4gTWF0aC5yb3VuZChAX2VsZXZhdGlvbiAqIDEwMDApIC8gMTAwMFxuXHRcdHNldDogKHZhbHVlKSAtPlxuXHRcdFx0dmFsdWUgPSBVdGlscy5jbGFtcCh2YWx1ZSwgLTkwLCA5MClcblx0XHRcdEBsb29rQXQoQF9oZWFkaW5nLCB2YWx1ZSlcblxuXHRAZGVmaW5lIFwidGlsdFwiLFxuXHRcdGdldDogLT4gQF90aWx0XG5cdFx0c2V0OiAodmFsdWUpIC0+IHRocm93IFwiVGlsdCBpcyByZWFkb25seVwiXG5cblx0U0lERVMubWFwIChmYWNlKSA9PlxuXHRcdEBkZWZpbmUgZmFjZSxcblx0XHRcdGdldDogLT4gQGxheWVyRnJvbUZhY2UoZmFjZSkgIyBAZ2V0SW1hZ2UoZmFjZSlcblx0XHRcdHNldDogKHZhbHVlKSAtPiBAc2V0SW1hZ2UoZmFjZSwgdmFsdWUpXG5cblx0Y3JlYXRlQ3ViZTogKGN1YmVTaWRlID0gQGN1YmVTaWRlKSA9PlxuXHRcdEBjdWJlU2lkZSA9IGN1YmVTaWRlXG5cblx0XHRAd29ybGQ/LmRlc3Ryb3koKVxuXHRcdEB3b3JsZCA9IG5ldyBMYXllclxuXHRcdFx0bmFtZTogXCJ3b3JsZFwiXG5cdFx0XHRzdXBlckxheWVyOiBAXG5cdFx0XHRzaXplOiBjdWJlU2lkZVxuXHRcdFx0YmFja2dyb3VuZENvbG9yOiBudWxsXG5cdFx0XHRjbGlwOiBmYWxzZVxuXHRcdEB3b3JsZC5jZW50ZXIoKVxuXG5cdFx0QHNpZGVzID0gW11cblx0XHRoYWxmQ3ViZVNpZGUgPSBAY3ViZVNpZGUgLyAyXG5cdFx0Y29sb3JzID0gW1wiIzg2NmNjY1wiLCBcIiMyOGFmZmFcIiwgXCIjMmRkN2FhXCIsIFwiI2ZmYzIyY1wiLCBcIiM3ZGRkMTFcIiwgXCIjZjk1ZmFhXCJdXG5cdFx0c2lkZU5hbWVzID0gW1wiZnJvbnRcIiwgXCJyaWdodFwiLCBcImJhY2tcIiwgXCJsZWZ0XCIsIFwidG9wXCIsIFwiYm90dG9tXCJdXG5cblx0XHRmb3Igc2lkZUluZGV4IGluIFswLi4uNl1cblxuXHRcdFx0cm90YXRpb25YID0gMFxuXHRcdFx0cm90YXRpb25YID0gLTkwIGlmIHNpZGVJbmRleCBpbiBbMC4uLjRdXG5cdFx0XHRyb3RhdGlvblggPSAxODAgaWYgc2lkZUluZGV4IGlzIDRcblxuXHRcdFx0cm90YXRpb25ZID0gMFxuXHRcdFx0cm90YXRpb25ZID0gc2lkZUluZGV4ICogLTkwIGlmIHNpZGVJbmRleCBpbiBbMC4uLjRdXG5cblx0XHRcdHNpZGUgPSBuZXcgTGF5ZXJcblx0XHRcdFx0c2l6ZTogY3ViZVNpZGVcblx0XHRcdFx0ejogLWhhbGZDdWJlU2lkZVxuXHRcdFx0XHRvcmlnaW5aOiBoYWxmQ3ViZVNpZGVcblx0XHRcdFx0cm90YXRpb25YOiByb3RhdGlvblhcblx0XHRcdFx0cm90YXRpb25ZOiByb3RhdGlvbllcblx0XHRcdFx0cGFyZW50OiBAd29ybGRcblx0XHRcdFx0bmFtZTogc2lkZU5hbWVzW3NpZGVJbmRleF1cblx0XHRcdFx0aHRtbDogc2lkZU5hbWVzW3NpZGVJbmRleF1cblx0XHRcdFx0Y29sb3I6IFwid2hpdGVcIlxuXHRcdFx0XHRiYWNrZ3JvdW5kQ29sb3I6IGNvbG9yc1tzaWRlSW5kZXhdXG5cdFx0XHRcdHN0eWxlOlxuXHRcdFx0XHRcdGxpbmVIZWlnaHQ6IFwiI3tjdWJlU2lkZX1weFwiXG5cdFx0XHRcdFx0dGV4dEFsaWduOiBcImNlbnRlclwiXG5cdFx0XHRcdFx0Zm9udFNpemU6IFwiI3tjdWJlU2lkZSAvIDEwfXB4XCJcblx0XHRcdFx0XHRmb250V2VpZ2h0OiBcIjEwMFwiXG5cdFx0XHRcdFx0Zm9udEZhbWlseTogXCJIZWx2ZXRpY2EgTmV1ZVwiXG5cdFx0XHRAc2lkZXMucHVzaChzaWRlKVxuXHRcdFx0c2lkZS5fYmFja2dyb3VuZENvbG9yID0gc2lkZS5iYWNrZ3JvdW5kQ29sb3JcblxuXHRcdGZvciBrZXkgb2YgQHNpZGVJbWFnZXMgd2hlbiBAc2lkZUltYWdlcz9cblx0XHRcdEBzZXRJbWFnZSBrZXksIEBzaWRlSW1hZ2VzW2tleV1cblxuXHRoaWRlRW52aXJvbWVudDogLT5cblx0XHRmb3Igc2lkZSBpbiBAc2lkZXNcblx0XHRcdHNpZGUuZGVzdHJveSgpXG5cblx0bGF5ZXJGcm9tRmFjZTogKGZhY2UpIC0+XG5cdFx0cmV0dXJuIHVubGVzcyBAc2lkZXM/XG5cdFx0bWFwID1cblx0XHRcdG5vcnRoOiBAc2lkZXNbMF1cblx0XHRcdGZyb250OiBAc2lkZXNbMF1cblx0XHRcdGVhc3Q6ICBAc2lkZXNbMV1cblx0XHRcdHJpZ2h0OiBAc2lkZXNbMV1cblx0XHRcdHNvdXRoOiBAc2lkZXNbMl1cblx0XHRcdGJhY2s6ICBAc2lkZXNbMl1cblx0XHRcdHdlc3Q6ICBAc2lkZXNbM11cblx0XHRcdGxlZnQ6ICBAc2lkZXNbM11cblx0XHRcdHRvcDogICBAc2lkZXNbNF1cblx0XHRcdGJvdHRvbTpAc2lkZXNbNV1cblx0XHRyZXR1cm4gbWFwW2ZhY2VdXG5cblx0c2V0SW1hZ2U6IChmYWNlLCBpbWFnZVBhdGgpIC0+XG5cblx0XHR0aHJvdyBFcnJvciBcIlZSQ29tcG9uZW50IHNldEltYWdlLCB3cm9uZyBuYW1lIGZvciBmYWNlOiBcIiArIGZhY2UgKyBcIiwgdmFsaWQgb3B0aW9uczogZnJvbnQsIHJpZ2h0LCBiYWNrLCBsZWZ0LCB0b3AsIGJvdHRvbSwgbm9ydGgsIGVhc3QsIHNvdXRoLCB3ZXN0XCIgdW5sZXNzIGZhY2UgaW4gU0lERVNcblxuXHRcdEBzaWRlSW1hZ2VzID0ge30gdW5sZXNzIEBzaWRlSW1hZ2VzP1xuXHRcdEBzaWRlSW1hZ2VzW2ZhY2VdID0gaW1hZ2VQYXRoXG5cblx0XHRsYXllciA9IEBsYXllckZyb21GYWNlKGZhY2UpXG5cblx0XHRpZiBpbWFnZVBhdGg/XG5cdFx0XHRsYXllcj8uaHRtbCA9IFwiXCJcblx0XHRcdGxheWVyPy5pbWFnZSA9IGltYWdlUGF0aFxuXHRcdGVsc2Vcblx0XHRcdGxheWVyPy5odG1sID0gbGF5ZXI/Lm5hbWVcblx0XHRcdGxheWVyPy5iYWNrZ3JvdW5kQ29sb3IgPSBsYXllcj8uX2JhY2tncm91bmRDb2xvclxuXG5cdGdldEltYWdlOiAoZmFjZSkgLT5cblxuXHRcdHRocm93IEVycm9yIFwiVlJDb21wb25lbnQgZ2V0SW1hZ2UsIHdyb25nIG5hbWUgZm9yIGZhY2U6IFwiICsgZmFjZSArIFwiLCB2YWxpZCBvcHRpb25zOiBmcm9udCwgcmlnaHQsIGJhY2ssIGxlZnQsIHRvcCwgYm90dG9tLCBub3J0aCwgZWFzdCwgc291dGgsIHdlc3RcIiB1bmxlc3MgZmFjZSBpbiBTSURFU1xuXG5cdFx0bGF5ZXIgPSBAbGF5ZXJGcm9tRmFjZShmYWNlKVxuXHRcdHJldHVybiBsYXllci5pbWFnZSBpZiBsYXllcj9cblxuXHRwcm9qZWN0TGF5ZXI6IChpbnNlcnRMYXllcikgLT5cblxuXHRcdGhlYWRpbmcgPSBpbnNlcnRMYXllci5oZWFkaW5nXG5cdFx0aGVhZGluZyA9IDAgdW5sZXNzIGhlYWRpbmc/XG5cblx0XHRpZiBoZWFkaW5nID49IDM2MFxuXHRcdFx0aGVhZGluZyA9IHZhbHVlICUgMzYwXG5cdFx0ZWxzZSBpZiBoZWFkaW5nIDwgMFxuXHRcdFx0cmVzdCA9IE1hdGguYWJzKGhlYWRpbmcpICUgMzYwXG5cdFx0XHRoZWFkaW5nID0gMzYwIC0gcmVzdFxuXG5cdFx0ZWxldmF0aW9uID0gaW5zZXJ0TGF5ZXIuZWxldmF0aW9uXG5cdFx0ZWxldmF0aW9uID0gMCB1bmxlc3MgZWxldmF0aW9uP1xuXHRcdGVsZXZhdGlvbiA9IFV0aWxzLmNsYW1wKGVsZXZhdGlvbiwgLTkwLCA5MClcblxuXHRcdGRpc3RhbmNlID0gaW5zZXJ0TGF5ZXIuZGlzdGFuY2Vcblx0XHRkaXN0YW5jZSA9IDEyMDAgdW5sZXNzIGRpc3RhbmNlP1xuXG5cdFx0aW5zZXJ0TGF5ZXIuaGVhZGluZyA9IGhlYWRpbmdcblx0XHRpbnNlcnRMYXllci5lbGV2YXRpb24gPSBlbGV2YXRpb25cblx0XHRpbnNlcnRMYXllci5kaXN0YW5jZSA9IGRpc3RhbmNlXG5cblx0XHRhbmNob3IgPSBuZXcgVlJBbmNob3JMYXllcihpbnNlcnRMYXllciwgQGN1YmVTaWRlKVxuXHRcdGFuY2hvci5zdXBlckxheWVyID0gQHdvcmxkXG5cblx0XHRAbG9va0F0KGhlYWRpbmcsIGVsZXZhdGlvbikgaWYgQGxvb2tBdExhdGVzdFByb2plY3RlZExheWVyXG5cblx0IyBNb2JpbGUgZGV2aWNlIG9yaWVudGF0aW9uXG5cblx0ZGV2aWNlT3JpZW50YXRpb25VcGRhdGU6ID0+XG5cblx0XHRpZiBVdGlscy5pc0Rlc2t0b3AoKVxuXHRcdFx0aWYgQGFycm93S2V5c1xuXHRcdFx0XHRpZiBAX2xhc3RDYWxsSG9yaXpvbnRhbCBpcyB1bmRlZmluZWRcblx0XHRcdFx0XHRAX2xhc3RDYWxsSG9yaXpvbnRhbCA9IDBcblx0XHRcdFx0XHRAX2xhc3RDYWxsVmVydGljYWwgPSAwXG5cdFx0XHRcdFx0QF9hY2NlbGVyYXRpb25Ib3Jpem9udGFsID0gMVxuXHRcdFx0XHRcdEBfYWNjZWxlcmF0aW9uVmVydGljYWwgPSAxXG5cdFx0XHRcdFx0QF9nb2luZ1VwID0gZmFsc2Vcblx0XHRcdFx0XHRAX2dvaW5nTGVmdCA9IGZhbHNlXG5cblx0XHRcdFx0ZGF0ZSA9IG5ldyBEYXRlKClcblx0XHRcdFx0eCA9IC4xXG5cdFx0XHRcdGlmIEtFWVNET1dOLnVwIG9yIEtFWVNET1dOLmRvd25cblx0XHRcdFx0XHRkaWZmID0gZGF0ZSAtIEBfbGFzdENhbGxWZXJ0aWNhbFxuXHRcdFx0XHRcdGlmIGRpZmYgPCAzMFxuXHRcdFx0XHRcdFx0aWYgQF9hY2NlbGVyYXRpb25WZXJ0aWNhbCA8IDMwXG5cdFx0XHRcdFx0XHRcdEBfYWNjZWxlcmF0aW9uVmVydGljYWwgKz0gMC4xOFxuXHRcdFx0XHRcdGlmIEtFWVNET1dOLnVwXG5cdFx0XHRcdFx0XHRpZiBAX2dvaW5nVXAgaXMgZmFsc2Vcblx0XHRcdFx0XHRcdFx0QF9hY2NlbGVyYXRpb25WZXJ0aWNhbCA9IDFcblx0XHRcdFx0XHRcdFx0QF9nb2luZ1VwID0gdHJ1ZVxuXHRcdFx0XHRcdFx0QGRlc2t0b3BQYW4oMCwgMSAqIEBfYWNjZWxlcmF0aW9uVmVydGljYWwgKiB4KVxuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdGlmIEBfZ29pbmdVcCBpcyB0cnVlXG5cdFx0XHRcdFx0XHRcdEBfYWNjZWxlcmF0aW9uVmVydGljYWwgPSAxXG5cdFx0XHRcdFx0XHRcdEBfZ29pbmdVcCA9IGZhbHNlXG5cblx0XHRcdFx0XHRcdEBkZXNrdG9wUGFuKDAsIC0xICogQF9hY2NlbGVyYXRpb25WZXJ0aWNhbCAqIHgpXG5cdFx0XHRcdFx0QF9sYXN0Q2FsbFZlcnRpY2FsID0gZGF0ZVxuXG5cdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRAX2FjY2VsZXJhdGlvblZlcnRpY2FsID0gMVxuXG5cdFx0XHRcdGlmIEtFWVNET1dOLmxlZnQgb3IgS0VZU0RPV04ucmlnaHRcblx0XHRcdFx0XHRkaWZmID0gZGF0ZSAtIEBfbGFzdENhbGxIb3Jpem9udGFsXG5cdFx0XHRcdFx0aWYgZGlmZiA8IDMwXG5cdFx0XHRcdFx0XHRpZiBAX2FjY2VsZXJhdGlvbkhvcml6b250YWwgPCAyNVxuXHRcdFx0XHRcdFx0XHRAX2FjY2VsZXJhdGlvbkhvcml6b250YWwgKz0gMC4xOFxuXHRcdFx0XHRcdGlmIEtFWVNET1dOLmxlZnRcblx0XHRcdFx0XHRcdGlmIEBfZ29pbmdMZWZ0IGlzIGZhbHNlXG5cdFx0XHRcdFx0XHRcdEBfYWNjZWxlcmF0aW9uSG9yaXpvbnRhbCA9IDFcblx0XHRcdFx0XHRcdFx0QF9nb2luZ0xlZnQgPSB0cnVlXG5cdFx0XHRcdFx0XHRAZGVza3RvcFBhbigxICogQF9hY2NlbGVyYXRpb25Ib3Jpem9udGFsICogeCwgMClcblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRpZiBAX2dvaW5nTGVmdCBpcyB0cnVlXG5cdFx0XHRcdFx0XHRcdEBfYWNjZWxlcmF0aW9uSG9yaXpvbnRhbCA9IDFcblx0XHRcdFx0XHRcdFx0QF9nb2luZ0xlZnQgPSBmYWxzZVxuXHRcdFx0XHRcdFx0QGRlc2t0b3BQYW4oLTEgKiBAX2FjY2VsZXJhdGlvbkhvcml6b250YWwgKiB4LCAwKVxuXHRcdFx0XHRcdEBfbGFzdENhbGxIb3Jpem9udGFsID0gZGF0ZVxuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0QF9hY2NlbGVyYXRpb25Ib3Jpem9udGFsID0gMVxuXG5cdFx0ZWxzZSBpZiBAb3JpZW50YXRpb25EYXRhP1xuXG5cdFx0XHRhbHBoYSA9IEBvcmllbnRhdGlvbkRhdGEuYWxwaGFcblx0XHRcdGJldGEgPSBAb3JpZW50YXRpb25EYXRhLmJldGFcblx0XHRcdGdhbW1hID0gQG9yaWVudGF0aW9uRGF0YS5nYW1tYVxuXG5cdFx0XHRAZGlyZWN0aW9uUGFyYW1zKGFscGhhLCBiZXRhLCBnYW1tYSkgaWYgYWxwaGEgaXNudCAwIGFuZCBiZXRhIGlzbnQgMCBhbmQgZ2FtbWEgaXNudCAwXG5cblx0XHRcdEB3b3JsZC5taWRYID0gQG1pZFhcblx0XHRcdEB3b3JsZC5taWRZID0gQG1pZFlcblx0XHRcdEB3b3JsZC56ID0gQHBlcnNwZWN0aXZlXG5cdFx0XHRAd29ybGQucm90YXRpb24gPSAtQF9oZWFkaW5nIC0gQF9oZWFkaW5nT2Zmc2V0XG5cdFx0XHRAd29ybGQucm90YXRpb25YID0gOTAgKyBAX2VsZXZhdGlvblxuXHRcdFx0QHdvcmxkLnJvdGF0aW9uWSA9IEBfdGlsdFxuXG5cdGRpcmVjdGlvblBhcmFtczogKGFscGhhLCBiZXRhLCBnYW1tYSkgLT5cblxuXHRcdGFscGhhUmFkID0gYWxwaGEgKiBAZGVnVG9SYWRcblx0XHRiZXRhUmFkID0gYmV0YSAqIEBkZWdUb1JhZFxuXHRcdGdhbW1hUmFkID0gZ2FtbWEgKiBAZGVnVG9SYWRcblxuXHRcdCMgQ2FsY3VsYXRlIGVxdWF0aW9uIGNvbXBvbmVudHNcblx0XHRjQSA9IE1hdGguY29zKGFscGhhUmFkKVxuXHRcdHNBID0gTWF0aC5zaW4oYWxwaGFSYWQpXG5cdFx0Y0IgPSBNYXRoLmNvcyhiZXRhUmFkKVxuXHRcdHNCID0gTWF0aC5zaW4oYmV0YVJhZClcblx0XHRjRyA9IE1hdGguY29zKGdhbW1hUmFkKVxuXHRcdHNHID0gTWF0aC5zaW4oZ2FtbWFSYWQpXG5cblx0XHQjIHggdW5pdHZlY3RvclxuXHRcdHhyQSA9IC1zQSAqIHNCICogc0cgKyBjQSAqIGNHXG5cdFx0eHJCID0gY0EgKiBzQiAqIHNHICsgc0EgKiBjR1xuXHRcdHhyQyA9IGNCICogc0dcblxuXHRcdCMgeSB1bml0dmVjdG9yXG5cdFx0eXJBID0gLXNBICogY0Jcblx0XHR5ckIgPSBjQSAqIGNCXG5cdFx0eXJDID0gLXNCXG5cblx0XHQjIC16IHVuaXR2ZWN0b3Jcblx0XHR6ckEgPSAtc0EgKiBzQiAqIGNHIC0gY0EgKiBzR1xuXHRcdHpyQiA9IGNBICogc0IgKiBjRyAtIHNBICogc0dcblx0XHR6ckMgPSBjQiAqIGNHXG5cblx0XHQjIENhbGN1bGF0ZSBoZWFkaW5nXG5cdFx0aGVhZGluZyA9IE1hdGguYXRhbih6ckEgLyB6ckIpXG5cblx0XHQjIENvbnZlcnQgZnJvbSBoYWxmIHVuaXQgY2lyY2xlIHRvIHdob2xlIHVuaXQgY2lyY2xlXG5cdFx0aWYgenJCIDwgMFxuXHRcdFx0aGVhZGluZyArPSBNYXRoLlBJXG5cdFx0ZWxzZSBpZiB6ckEgPCAwXG5cdFx0XHRoZWFkaW5nICs9IDIgKiBNYXRoLlBJXG5cblx0XHQjICMgQ2FsY3VsYXRlIEFsdGl0dWRlIChpbiBkZWdyZWVzKVxuXHRcdGVsZXZhdGlvbiA9IE1hdGguUEkgLyAyIC0gTWF0aC5hY29zKC16ckMpXG5cblx0XHRjSCA9IE1hdGguc3FydCgxIC0gKHpyQyAqIHpyQykpXG5cdFx0dGlsdCA9IE1hdGguYWNvcygteHJDIC8gY0gpICogTWF0aC5zaWduKHlyQylcblxuXHRcdCMgQ29udmVydCByYWRpYW5zIHRvIGRlZ3JlZXNcblx0XHRoZWFkaW5nICo9IDE4MCAvIE1hdGguUElcblx0XHRlbGV2YXRpb24gKj0gMTgwIC8gTWF0aC5QSVxuXHRcdHRpbHQgKj0gMTgwIC8gTWF0aC5QSVxuXG5cdFx0QF9oZWFkaW5nID0gTWF0aC5yb3VuZChoZWFkaW5nICogMTAwMCkgLyAxMDAwXG5cdFx0QF9lbGV2YXRpb24gPSBNYXRoLnJvdW5kKGVsZXZhdGlvbiAqIDEwMDApIC8gMTAwMFxuXG5cdFx0dGlsdCA9IE1hdGgucm91bmQodGlsdCAqIDEwMDApIC8gMTAwMFxuXHRcdG9yaWVudGF0aW9uVGlsdE9mZnNldCA9ICh3aW5kb3cub3JpZW50YXRpb24gKiAtMSkgKyA5MFxuXHRcdHRpbHQgKz0gb3JpZW50YXRpb25UaWx0T2Zmc2V0XG5cdFx0dGlsdCAtPSAzNjAgaWYgdGlsdCA+IDE4MFxuXHRcdEBfdGlsdCA9IHRpbHRcblxuXHRcdEBfZGV2aWNlSGVhZGluZyA9IEBfaGVhZGluZ1xuXHRcdEBfZGV2aWNlRWxldmF0aW9uID0gQF9lbGV2YXRpb25cblx0XHRAX2VtaXRPcmllbnRhdGlvbkRpZENoYW5nZUV2ZW50KClcblxuXHQjIFBhbm5pbmdcblxuXHRfY2FudmFzVG9Db21wb25lbnRSYXRpbzogPT5cblx0XHRwb2ludEEgPSBVdGlscy5jb252ZXJ0UG9pbnRGcm9tQ29udGV4dCh7eDowLCB5OjB9LCBALCB0cnVlKVxuXHRcdHBvaW50QiA9IFV0aWxzLmNvbnZlcnRQb2ludEZyb21Db250ZXh0KHt4OjEsIHk6MX0sIEAsIHRydWUpXG5cdFx0eERpc3QgPSBNYXRoLmFicyhwb2ludEEueCAtIHBvaW50Qi54KVxuXHRcdHlEaXN0ID0gTWF0aC5hYnMocG9pbnRBLnkgLSBwb2ludEIueSlcblx0XHRyZXR1cm4ge3g6eERpc3QsIHk6eURpc3R9XG5cblx0c2V0dXBQYW46IChlbmFibGVkKSA9PlxuXG5cdFx0QHBhbm5pbmcgPSBlbmFibGVkXG5cdFx0QGRlc2t0b3BQYW4oMCwgMClcblxuXHRcdEBvbk1vdXNlRG93biA9PiBAYW5pbWF0ZVN0b3AoKVxuXG5cdFx0QG9uUGFuIChkYXRhKSA9PlxuXHRcdFx0cmV0dXJuIGlmIG5vdCBAcGFubmluZ1xuXHRcdFx0cmF0aW8gPSBAX2NhbnZhc1RvQ29tcG9uZW50UmF0aW8oKVxuXHRcdFx0ZGVsdGFYID0gZGF0YS5kZWx0YVggKiByYXRpby54XG5cdFx0XHRkZWx0YVkgPSBkYXRhLmRlbHRhWSAqIHJhdGlvLnlcblx0XHRcdHN0cmVuZ3RoID0gVXRpbHMubW9kdWxhdGUoQHBlcnNwZWN0aXZlLCBbMTIwMCwgOTAwXSwgWzIyLCAxNy41XSlcblxuXHRcdFx0aWYgVXRpbHMuaXNNb2JpbGUoKVxuXHRcdFx0XHRAX2hlYWRpbmdPZmZzZXQgLT0gKGRlbHRhWCAvIHN0cmVuZ3RoKSBpZiBAbW9iaWxlUGFubmluZ1xuXHRcdFx0ZWxzZVxuXHRcdFx0XHRAZGVza3RvcFBhbihkZWx0YVggLyBzdHJlbmd0aCwgZGVsdGFZIC8gc3RyZW5ndGgpXG5cblx0XHRcdEBfcHJldlZlbG9YID0gZGF0YS52ZWxvY2l0eVhcblx0XHRcdEBfcHJldlZlbG9VID0gZGF0YS52ZWxvY2l0eVlcblxuXHRcdEBvblBhbkVuZCAoZGF0YSkgPT5cblx0XHRcdHJldHVybiBpZiBub3QgQHBhbm5pbmcgb3IgVXRpbHMuaXNNb2JpbGUoKVxuXHRcdFx0cmF0aW8gPSBAX2NhbnZhc1RvQ29tcG9uZW50UmF0aW8oKVxuXHRcdFx0dmVsb2NpdHlYID0gKGRhdGEudmVsb2NpdHlYICsgQF9wcmV2VmVsb1gpICogMC41XG5cdFx0XHR2ZWxvY2l0eVkgPSAoZGF0YS52ZWxvY2l0eVkgKyBAX3ByZXZWZWxvWSkgKiAwLjVcblx0XHRcdHZlbG9jaXR5WCAqPSB2ZWxvY2l0eVhcblx0XHRcdHZlbG9jaXR5WSAqPSB2ZWxvY2l0eVlcblx0XHRcdHZlbG9jaXR5WCAqPSByYXRpby54XG5cdFx0XHR2ZWxvY2l0eVkgKj0gcmF0aW8ueVxuXHRcdFx0c3RyZW5ndGggPSBVdGlscy5tb2R1bGF0ZShAcGVyc3BlY3RpdmUsIFsxMjAwLCA5MDBdLCBbMjIsIDE3LjVdKVxuXHRcdFx0dmVsbyA9IE1hdGguZmxvb3IoTWF0aC5zcXJ0KHZlbG9jaXR5WCArIHZlbG9jaXR5WSkgKiA1KSAvIHN0cmVuZ3RoXG5cdFx0XHRAYW5pbWF0ZVxuXHRcdFx0XHRwcm9wZXJ0aWVzOlxuXHRcdFx0XHRcdGhlYWRpbmc6IEBoZWFkaW5nIC0gKGRhdGEudmVsb2NpdHlYICogcmF0aW8ueCAqIDIwMCkgLyBzdHJlbmd0aFxuXHRcdFx0XHRcdGVsZXZhdGlvbjogQGVsZXZhdGlvbiArIChkYXRhLnZlbG9jaXR5WSAqIHJhdGlvLnkgKiAyMDApIC8gc3RyZW5ndGhcblx0XHRcdFx0Y3VydmU6IFwic3ByaW5nKDMwMCwgMTAwLCAje3ZlbG99KVwiXG5cblx0ZGVza3RvcFBhbjogKGRlbHRhRGlyLCBkZWx0YUhlaWdodCkgLT5cblx0XHRoYWxmQ3ViZVNpZGUgPSBAY3ViZVNpZGUvMlxuXHRcdEBfaGVhZGluZyAtPSBkZWx0YURpclxuXG5cdFx0aWYgQF9oZWFkaW5nID4gMzYwXG5cdFx0XHRAX2hlYWRpbmcgLT0gMzYwXG5cdFx0ZWxzZSBpZiBAX2hlYWRpbmcgPCAwXG5cdFx0XHRAX2hlYWRpbmcgKz0gMzYwXG5cblx0XHRAX2VsZXZhdGlvbiArPSBkZWx0YUhlaWdodFxuXHRcdEBfZWxldmF0aW9uID0gVXRpbHMuY2xhbXAoQF9lbGV2YXRpb24sIC05MCwgOTApXG5cblx0XHRAd29ybGQubWlkWCA9IEBtaWRYXG5cdFx0QHdvcmxkLm1pZFkgPSBAbWlkWVxuXHRcdEB3b3JsZC56ID0gQHBlcnNwZWN0aXZlXG5cdFx0QHdvcmxkLnJvdGF0aW9uWCA9IDkwICsgQF9lbGV2YXRpb25cblx0XHRAd29ybGQucm90YXRpb24gPSAtQF9oZWFkaW5nIC0gQF9oZWFkaW5nT2Zmc2V0XG5cblx0XHRAX2VtaXRPcmllbnRhdGlvbkRpZENoYW5nZUV2ZW50KClcblxuXHRsb29rQXQ6IChoZWFkaW5nLCBlbGV2YXRpb24pIC0+XG5cblx0XHRAd29ybGQubWlkWCA9IEBtaWRYXG5cdFx0QHdvcmxkLm1pZFkgPSBAbWlkWVxuXHRcdEB3b3JsZC56ID0gQHBlcnNwZWN0aXZlXG5cdFx0QHdvcmxkLnJvdGF0aW9uWCA9IDkwICsgQF9lbGV2YXRpb25cblx0XHRAd29ybGQucm90YXRpb24gPSAtQF9oZWFkaW5nXG5cdFx0QHdvcmxkLnJvdGF0aW9uWSA9IEBfdGlsdFxuXG5cdFx0QF9oZWFkaW5nID0gaGVhZGluZ1xuXHRcdEBfZWxldmF0aW9uID0gZWxldmF0aW9uXG5cdFx0QF9oZWFkaW5nT2Zmc2V0ID0gQF9oZWFkaW5nIC0gQF9kZXZpY2VIZWFkaW5nIGlmIFV0aWxzLmlzTW9iaWxlKClcblx0XHRAX2VsZXZhdGlvbk9mZnNldCA9IEBfZWxldmF0aW9uIC0gQF9kZXZpY2VFbGV2YXRpb25cblxuXHRcdGhlYWRpbmcgPSBAX2hlYWRpbmdcblx0XHRpZiBoZWFkaW5nIDwgMFxuXHRcdFx0aGVhZGluZyArPSAzNjBcblx0XHRlbHNlIGlmIGhlYWRpbmcgPiAzNjBcblx0XHRcdGhlYWRpbmcgLT0gMzYwXG5cblx0XHRAX2VtaXRPcmllbnRhdGlvbkRpZENoYW5nZUV2ZW50KClcblxuXHRfZW1pdE9yaWVudGF0aW9uRGlkQ2hhbmdlRXZlbnQ6ID0+XG5cdFx0QGVtaXQoRXZlbnRzLk9yaWVudGF0aW9uRGlkQ2hhbmdlLCB7aGVhZGluZzogQGhlYWRpbmcsIGVsZXZhdGlvbjogQGVsZXZhdGlvbiwgdGlsdDogQHRpbHR9KVxuXG5cdCMgZXZlbnQgc2hvcnRjdXRzXG5cblx0b25PcmllbnRhdGlvbkNoYW5nZTooY2IpIC0+IEBvbihFdmVudHMuT3JpZW50YXRpb25EaWRDaGFuZ2UsIGNiKSIsIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBRUFBO0FEQUE7QUFBQSxJQUFBLG9DQUFBO0VBQUE7Ozs7O0FBc0NBLEtBQUEsR0FBUSxDQUNQLE9BRE8sRUFFUCxPQUZPLEVBR1AsTUFITyxFQUlQLE9BSk8sRUFLUCxPQUxPLEVBTVAsTUFOTyxFQU9QLE1BUE8sRUFRUCxNQVJPLEVBU1AsS0FUTyxFQVVQLFFBVk87O0FBYVIsSUFBQSxHQUFPO0VBQ04sU0FBQSxFQUFXLEVBREw7RUFFTixPQUFBLEVBQVMsRUFGSDtFQUdOLFVBQUEsRUFBWSxFQUhOO0VBSU4sU0FBQSxFQUFXLEVBSkw7OztBQU9QLFFBQUEsR0FBVztFQUNWLElBQUEsRUFBTSxLQURJO0VBRVYsRUFBQSxFQUFJLEtBRk07RUFHVixLQUFBLEVBQU8sS0FIRztFQUlWLElBQUEsRUFBTSxLQUpJOzs7QUFPWCxNQUFNLENBQUMsb0JBQVAsR0FBOEI7O0FBRXhCOzs7RUFFUSx1QkFBQyxLQUFELEVBQVEsUUFBUjtJQUNaLDZDQUFBO0lBQ0EsSUFBQyxDQUFBLEtBQUQsR0FBUztJQUNULElBQUMsQ0FBQSxNQUFELEdBQVU7SUFDVixJQUFDLENBQUEsSUFBRCxHQUFRO0lBQ1IsSUFBQyxDQUFBLElBQUQsR0FBUTtJQUNSLElBQUMsQ0FBQSxRQUFELEdBQVk7SUFDWixJQUFDLENBQUEsZUFBRCxHQUFtQjtJQUVuQixJQUFDLENBQUEsS0FBRCxHQUFTO0lBQ1QsS0FBSyxDQUFDLE1BQU4sR0FBZTtJQUNmLEtBQUssQ0FBQyxNQUFOLENBQUE7SUFFQSxLQUFLLENBQUMsRUFBTixDQUFTLG9CQUFULEVBQStCLENBQUEsU0FBQSxLQUFBO2FBQUEsU0FBQyxRQUFELEVBQVcsS0FBWDtlQUFxQixLQUFDLENBQUEsY0FBRCxDQUFnQixLQUFoQjtNQUFyQjtJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBL0I7SUFDQSxJQUFDLENBQUEsY0FBRCxDQUFnQixLQUFoQjtJQUVBLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBZixDQUFrQixlQUFsQixFQUFtQyxDQUFBLFNBQUEsS0FBQTthQUFBLFNBQUMsS0FBRDtRQUFXLElBQWMsS0FBQSxLQUFTLEtBQUMsQ0FBQSxLQUF4QjtpQkFBQSxLQUFDLENBQUEsT0FBRCxDQUFBLEVBQUE7O01BQVg7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQW5DO0VBaEJZOzswQkFrQmIsY0FBQSxHQUFnQixTQUFDLEtBQUQ7QUFDZixRQUFBO0lBQUEsWUFBQSxHQUFlLElBQUMsQ0FBQSxRQUFELEdBQVk7SUFDM0IsSUFBQyxDQUFBLElBQUQsR0FBUTtJQUNSLElBQUMsQ0FBQSxJQUFELEdBQVE7SUFDUixJQUFDLENBQUEsQ0FBRCxHQUFLLENBQUUsS0FBSyxDQUFDO0lBQ2IsSUFBQyxDQUFBLE9BQUQsR0FBVyxLQUFLLENBQUM7SUFDakIsSUFBQyxDQUFBLFNBQUQsR0FBYSxDQUFDLEVBQUQsR0FBTSxLQUFLLENBQUM7V0FDekIsSUFBQyxDQUFBLFNBQUQsR0FBYSxDQUFDLEtBQUssQ0FBQztFQVBMOzs7O0dBcEJXOztBQTZCdEIsT0FBTyxDQUFDOzs7RUFFQSxpQkFBQyxPQUFEOztNQUFDLFVBQVU7O0lBQ3ZCLE9BQUEsR0FBVSxDQUFDLENBQUMsUUFBRixDQUFXLE9BQVgsRUFDVDtNQUFBLE9BQUEsRUFBUyxDQUFUO01BQ0EsU0FBQSxFQUFXLENBRFg7S0FEUztJQUdWLHlDQUFNLE9BQU47RUFKWTs7RUFNYixPQUFDLENBQUEsTUFBRCxDQUFRLFNBQVIsRUFDQztJQUFBLEdBQUEsRUFBSyxTQUFBO2FBQUcsSUFBQyxDQUFBO0lBQUosQ0FBTDtJQUNBLEdBQUEsRUFBSyxTQUFDLEtBQUQ7QUFDSixVQUFBO01BQUEsSUFBRyxLQUFBLElBQVMsR0FBWjtRQUNDLEtBQUEsR0FBUSxLQUFBLEdBQVEsSUFEakI7T0FBQSxNQUVLLElBQUcsS0FBQSxHQUFRLENBQVg7UUFDSixJQUFBLEdBQU8sSUFBSSxDQUFDLEdBQUwsQ0FBUyxLQUFULENBQUEsR0FBa0I7UUFDekIsS0FBQSxHQUFRLEdBQUEsR0FBTSxLQUZWOztNQUdMLFlBQUEsR0FBZSxJQUFJLENBQUMsS0FBTCxDQUFXLEtBQUEsR0FBUSxJQUFuQixDQUFBLEdBQTJCO01BQzFDLElBQUcsSUFBQyxDQUFBLFFBQUQsS0FBZSxZQUFsQjtRQUNDLElBQUMsQ0FBQSxRQUFELEdBQVk7UUFDWixJQUFDLENBQUEsSUFBRCxDQUFNLGdCQUFOLEVBQXdCLElBQUMsQ0FBQSxRQUF6QjtlQUNBLElBQUMsQ0FBQSxJQUFELENBQU0sb0JBQU4sRUFBNEIsSUFBQyxDQUFBLFFBQTdCLEVBSEQ7O0lBUEksQ0FETDtHQUREOztFQWNBLE9BQUMsQ0FBQSxNQUFELENBQVEsV0FBUixFQUNDO0lBQUEsR0FBQSxFQUFLLFNBQUE7YUFBRyxJQUFDLENBQUE7SUFBSixDQUFMO0lBQ0EsR0FBQSxFQUFLLFNBQUMsS0FBRDtBQUNKLFVBQUE7TUFBQSxLQUFBLEdBQVEsS0FBSyxDQUFDLEtBQU4sQ0FBWSxLQUFaLEVBQW1CLENBQUMsRUFBcEIsRUFBd0IsRUFBeEI7TUFDUixZQUFBLEdBQWUsSUFBSSxDQUFDLEtBQUwsQ0FBVyxLQUFBLEdBQVEsSUFBbkIsQ0FBQSxHQUEyQjtNQUMxQyxJQUFHLFlBQUEsS0FBa0IsSUFBQyxDQUFBLFVBQXRCO1FBQ0MsSUFBQyxDQUFBLFVBQUQsR0FBYztRQUNkLElBQUMsQ0FBQSxJQUFELENBQU0sa0JBQU4sRUFBMEIsWUFBMUI7ZUFDQSxJQUFDLENBQUEsSUFBRCxDQUFNLG9CQUFOLEVBQTRCLFlBQTVCLEVBSEQ7O0lBSEksQ0FETDtHQUREOztFQVVBLE9BQUMsQ0FBQSxNQUFELENBQVEsVUFBUixFQUNDO0lBQUEsR0FBQSxFQUFLLFNBQUE7YUFBRyxJQUFDLENBQUE7SUFBSixDQUFMO0lBQ0EsR0FBQSxFQUFLLFNBQUMsS0FBRDtNQUNKLElBQUcsS0FBQSxLQUFXLElBQUMsQ0FBQSxTQUFmO1FBQ0MsSUFBQyxDQUFBLFNBQUQsR0FBYTtRQUNiLElBQUMsQ0FBQSxJQUFELENBQU0saUJBQU4sRUFBeUIsS0FBekI7ZUFDQSxJQUFDLENBQUEsSUFBRCxDQUFNLG9CQUFOLEVBQTRCLEtBQTVCLEVBSEQ7O0lBREksQ0FETDtHQUREOzs7O0dBaEM2Qjs7QUF3Q3hCLE9BQU8sQ0FBQzs7O0VBRUEscUJBQUMsT0FBRDs7TUFBQyxVQUFVOzs7Ozs7OztJQUN2QixPQUFBLEdBQVUsQ0FBQyxDQUFDLFFBQUYsQ0FBVyxPQUFYLEVBQ1Q7TUFBQSxRQUFBLEVBQVUsSUFBVjtNQUNBLFdBQUEsRUFBYSxJQURiO01BRUEsMEJBQUEsRUFBNEIsS0FGNUI7TUFHQSxLQUFBLEVBQU8sTUFBTSxDQUFDLEtBSGQ7TUFJQSxNQUFBLEVBQVEsTUFBTSxDQUFDLE1BSmY7TUFLQSxTQUFBLEVBQVcsSUFMWDtNQU1BLE9BQUEsRUFBUyxJQU5UO01BT0EsYUFBQSxFQUFlLElBUGY7TUFRQSxJQUFBLEVBQU0sSUFSTjtNQVNBLElBQUEsRUFBTSxJQVROO0tBRFM7SUFXViw2Q0FBTSxPQUFOO0lBR0EsTUFBTSxDQUFDLGVBQVAsR0FBeUI7SUFDekIsTUFBTSxDQUFDLFdBQVAsR0FBcUI7SUFFckIsSUFBQyxDQUFBLGtCQUFELENBQUE7SUFDQSxJQUFDLENBQUEsUUFBRCxHQUFZLElBQUksQ0FBQyxFQUFMLEdBQVU7SUFDdEIsSUFBQyxDQUFBLGVBQUQsR0FBbUI7SUFFbkIsSUFBQyxDQUFBLFVBQUQsQ0FBWSxPQUFPLENBQUMsUUFBcEI7SUFDQSxJQUFDLENBQUEsMEJBQUQsR0FBOEIsT0FBTyxDQUFDO0lBQ3RDLElBQUMsQ0FBQSxTQUFELENBQVcsT0FBTyxDQUFDLFNBQW5CO0lBRUEsSUFBOEIsdUJBQTlCO01BQUEsSUFBQyxDQUFBLE9BQUQsR0FBVyxPQUFPLENBQUMsUUFBbkI7O0lBQ0EsSUFBa0MseUJBQWxDO01BQUEsSUFBQyxDQUFBLFNBQUQsR0FBYSxPQUFPLENBQUMsVUFBckI7O0lBRUEsSUFBQyxDQUFBLFFBQUQsQ0FBVSxPQUFPLENBQUMsT0FBbEI7SUFDQSxJQUFDLENBQUEsYUFBRCxHQUFpQixPQUFPLENBQUM7SUFFekIsSUFBRyxLQUFLLENBQUMsUUFBTixDQUFBLENBQUg7TUFDQyxNQUFNLENBQUMsZ0JBQVAsQ0FBd0IsbUJBQXhCLEVBQTZDLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxLQUFEO2lCQUFXLEtBQUMsQ0FBQSxlQUFELEdBQW1CO1FBQTlCO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUE3QyxFQUREOztJQUdBLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBWixDQUFlLFFBQWYsRUFBeUIsSUFBQyxDQUFBLHVCQUExQjtJQUdBLE1BQU0sQ0FBQyxjQUFjLENBQUMsRUFBdEIsQ0FBeUIsT0FBekIsRUFBa0MsU0FBQTthQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBWixDQUFnQixRQUFoQixFQUEwQixJQUFDLENBQUEsdUJBQTNCO0lBQUgsQ0FBbEM7SUFFQSxJQUFDLENBQUEsRUFBRCxDQUFJLGNBQUosRUFBb0IsU0FBQTthQUFHLElBQUMsQ0FBQSxVQUFELENBQVksQ0FBWixFQUFjLENBQWQ7SUFBSCxDQUFwQjtFQXhDWTs7d0JBMENiLGtCQUFBLEdBQW9CLFNBQUE7SUFFbkIsSUFBQyxDQUFBLFFBQUQsR0FBWTtJQUNaLElBQUMsQ0FBQSxVQUFELEdBQWM7SUFDZCxJQUFDLENBQUEsS0FBRCxHQUFTO0lBRVQsSUFBQyxDQUFBLGNBQUQsR0FBa0I7SUFDbEIsSUFBQyxDQUFBLGdCQUFELEdBQW9CO0lBQ3BCLElBQUMsQ0FBQSxjQUFELEdBQWtCO1dBQ2xCLElBQUMsQ0FBQSxnQkFBRCxHQUFvQjtFQVREOzt3QkFXcEIsU0FBQSxHQUFXLFNBQUMsT0FBRDtJQUVWLElBQUMsQ0FBQSxTQUFELEdBQWE7SUFFYixRQUFRLENBQUMsZ0JBQVQsQ0FBMEIsU0FBMUIsRUFBcUMsQ0FBQSxTQUFBLEtBQUE7YUFBQSxTQUFDLEtBQUQ7QUFDcEMsZ0JBQU8sS0FBSyxDQUFDLEtBQWI7QUFBQSxlQUNNLElBQUksQ0FBQyxPQURYO1lBRUUsUUFBUSxDQUFDLEVBQVQsR0FBYzttQkFDZCxLQUFLLENBQUMsY0FBTixDQUFBO0FBSEYsZUFJTSxJQUFJLENBQUMsU0FKWDtZQUtFLFFBQVEsQ0FBQyxJQUFULEdBQWdCO21CQUNoQixLQUFLLENBQUMsY0FBTixDQUFBO0FBTkYsZUFPTSxJQUFJLENBQUMsU0FQWDtZQVFFLFFBQVEsQ0FBQyxJQUFULEdBQWdCO21CQUNoQixLQUFLLENBQUMsY0FBTixDQUFBO0FBVEYsZUFVTSxJQUFJLENBQUMsVUFWWDtZQVdFLFFBQVEsQ0FBQyxLQUFULEdBQWlCO21CQUNqQixLQUFLLENBQUMsY0FBTixDQUFBO0FBWkY7TUFEb0M7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXJDO0lBZUEsUUFBUSxDQUFDLGdCQUFULENBQTBCLE9BQTFCLEVBQW1DLENBQUEsU0FBQSxLQUFBO2FBQUEsU0FBQyxLQUFEO0FBQ2xDLGdCQUFPLEtBQUssQ0FBQyxLQUFiO0FBQUEsZUFDTSxJQUFJLENBQUMsT0FEWDtZQUVFLFFBQVEsQ0FBQyxFQUFULEdBQWM7bUJBQ2QsS0FBSyxDQUFDLGNBQU4sQ0FBQTtBQUhGLGVBSU0sSUFBSSxDQUFDLFNBSlg7WUFLRSxRQUFRLENBQUMsSUFBVCxHQUFnQjttQkFDaEIsS0FBSyxDQUFDLGNBQU4sQ0FBQTtBQU5GLGVBT00sSUFBSSxDQUFDLFNBUFg7WUFRRSxRQUFRLENBQUMsSUFBVCxHQUFnQjttQkFDaEIsS0FBSyxDQUFDLGNBQU4sQ0FBQTtBQVRGLGVBVU0sSUFBSSxDQUFDLFVBVlg7WUFXRSxRQUFRLENBQUMsS0FBVCxHQUFpQjttQkFDakIsS0FBSyxDQUFDLGNBQU4sQ0FBQTtBQVpGO01BRGtDO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFuQztXQWVBLE1BQU0sQ0FBQyxNQUFQLEdBQWdCLFNBQUE7TUFDZixRQUFRLENBQUMsRUFBVCxHQUFjO01BQ2QsUUFBUSxDQUFDLElBQVQsR0FBZ0I7TUFDaEIsUUFBUSxDQUFDLElBQVQsR0FBZ0I7YUFDaEIsUUFBUSxDQUFDLEtBQVQsR0FBaUI7SUFKRjtFQWxDTjs7RUF3Q1gsV0FBQyxDQUFBLE1BQUQsQ0FBUSxTQUFSLEVBQ0M7SUFBQSxHQUFBLEVBQUssU0FBQTtBQUNKLFVBQUE7TUFBQSxPQUFBLEdBQVUsSUFBQyxDQUFBLFFBQUQsR0FBWSxJQUFDLENBQUE7TUFDdkIsSUFBRyxPQUFBLEdBQVUsR0FBYjtRQUNDLE9BQUEsR0FBVSxPQUFBLEdBQVUsSUFEckI7T0FBQSxNQUVLLElBQUcsT0FBQSxHQUFVLENBQWI7UUFDSixJQUFBLEdBQU8sSUFBSSxDQUFDLEdBQUwsQ0FBUyxPQUFULENBQUEsR0FBb0I7UUFDM0IsT0FBQSxHQUFVLEdBQUEsR0FBTSxLQUZaOztBQUdMLGFBQU8sSUFBSSxDQUFDLEtBQUwsQ0FBVyxPQUFBLEdBQVUsSUFBckIsQ0FBQSxHQUE2QjtJQVBoQyxDQUFMO0lBUUEsR0FBQSxFQUFLLFNBQUMsS0FBRDthQUNKLElBQUMsQ0FBQSxNQUFELENBQVEsS0FBUixFQUFlLElBQUMsQ0FBQSxVQUFoQjtJQURJLENBUkw7R0FERDs7RUFZQSxXQUFDLENBQUEsTUFBRCxDQUFRLFdBQVIsRUFDQztJQUFBLEdBQUEsRUFBSyxTQUFBO2FBQUcsSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUFDLENBQUEsVUFBRCxHQUFjLElBQXpCLENBQUEsR0FBaUM7SUFBcEMsQ0FBTDtJQUNBLEdBQUEsRUFBSyxTQUFDLEtBQUQ7TUFDSixLQUFBLEdBQVEsS0FBSyxDQUFDLEtBQU4sQ0FBWSxLQUFaLEVBQW1CLENBQUMsRUFBcEIsRUFBd0IsRUFBeEI7YUFDUixJQUFDLENBQUEsTUFBRCxDQUFRLElBQUMsQ0FBQSxRQUFULEVBQW1CLEtBQW5CO0lBRkksQ0FETDtHQUREOztFQU1BLFdBQUMsQ0FBQSxNQUFELENBQVEsTUFBUixFQUNDO0lBQUEsR0FBQSxFQUFLLFNBQUE7YUFBRyxJQUFDLENBQUE7SUFBSixDQUFMO0lBQ0EsR0FBQSxFQUFLLFNBQUMsS0FBRDtBQUFXLFlBQU07SUFBakIsQ0FETDtHQUREOztFQUlBLEtBQUssQ0FBQyxHQUFOLENBQVUsU0FBQyxJQUFEO1dBQ1QsV0FBQyxDQUFBLE1BQUQsQ0FBUSxJQUFSLEVBQ0M7TUFBQSxHQUFBLEVBQUssU0FBQTtlQUFHLElBQUMsQ0FBQSxhQUFELENBQWUsSUFBZjtNQUFILENBQUw7TUFDQSxHQUFBLEVBQUssU0FBQyxLQUFEO2VBQVcsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFWLEVBQWdCLEtBQWhCO01BQVgsQ0FETDtLQUREO0VBRFMsQ0FBVjs7d0JBS0EsVUFBQSxHQUFZLFNBQUMsUUFBRDtBQUNYLFFBQUE7O01BRFksV0FBVyxJQUFDLENBQUE7O0lBQ3hCLElBQUMsQ0FBQSxRQUFELEdBQVk7O1NBRU4sQ0FBRSxPQUFSLENBQUE7O0lBQ0EsSUFBQyxDQUFBLEtBQUQsR0FBYSxJQUFBLEtBQUEsQ0FDWjtNQUFBLElBQUEsRUFBTSxPQUFOO01BQ0EsVUFBQSxFQUFZLElBRFo7TUFFQSxJQUFBLEVBQU0sUUFGTjtNQUdBLGVBQUEsRUFBaUIsSUFIakI7TUFJQSxJQUFBLEVBQU0sS0FKTjtLQURZO0lBTWIsSUFBQyxDQUFBLEtBQUssQ0FBQyxNQUFQLENBQUE7SUFFQSxJQUFDLENBQUEsS0FBRCxHQUFTO0lBQ1QsWUFBQSxHQUFlLElBQUMsQ0FBQSxRQUFELEdBQVk7SUFDM0IsTUFBQSxHQUFTLENBQUMsU0FBRCxFQUFZLFNBQVosRUFBdUIsU0FBdkIsRUFBa0MsU0FBbEMsRUFBNkMsU0FBN0MsRUFBd0QsU0FBeEQ7SUFDVCxTQUFBLEdBQVksQ0FBQyxPQUFELEVBQVUsT0FBVixFQUFtQixNQUFuQixFQUEyQixNQUEzQixFQUFtQyxLQUFuQyxFQUEwQyxRQUExQztBQUVaLFNBQWlCLHlDQUFqQjtNQUVDLFNBQUEsR0FBWTtNQUNaLElBQW1CLGFBQWEsWUFBYixFQUFBLFNBQUEsTUFBbkI7UUFBQSxTQUFBLEdBQVksQ0FBQyxHQUFiOztNQUNBLElBQW1CLFNBQUEsS0FBYSxDQUFoQztRQUFBLFNBQUEsR0FBWSxJQUFaOztNQUVBLFNBQUEsR0FBWTtNQUNaLElBQStCLGFBQWEsWUFBYixFQUFBLFNBQUEsTUFBL0I7UUFBQSxTQUFBLEdBQVksU0FBQSxHQUFZLENBQUMsR0FBekI7O01BRUEsSUFBQSxHQUFXLElBQUEsS0FBQSxDQUNWO1FBQUEsSUFBQSxFQUFNLFFBQU47UUFDQSxDQUFBLEVBQUcsQ0FBQyxZQURKO1FBRUEsT0FBQSxFQUFTLFlBRlQ7UUFHQSxTQUFBLEVBQVcsU0FIWDtRQUlBLFNBQUEsRUFBVyxTQUpYO1FBS0EsTUFBQSxFQUFRLElBQUMsQ0FBQSxLQUxUO1FBTUEsSUFBQSxFQUFNLFNBQVUsQ0FBQSxTQUFBLENBTmhCO1FBT0EsSUFBQSxFQUFNLFNBQVUsQ0FBQSxTQUFBLENBUGhCO1FBUUEsS0FBQSxFQUFPLE9BUlA7UUFTQSxlQUFBLEVBQWlCLE1BQU8sQ0FBQSxTQUFBLENBVHhCO1FBVUEsS0FBQSxFQUNDO1VBQUEsVUFBQSxFQUFlLFFBQUQsR0FBVSxJQUF4QjtVQUNBLFNBQUEsRUFBVyxRQURYO1VBRUEsUUFBQSxFQUFZLENBQUMsUUFBQSxHQUFXLEVBQVosQ0FBQSxHQUFlLElBRjNCO1VBR0EsVUFBQSxFQUFZLEtBSFo7VUFJQSxVQUFBLEVBQVksZ0JBSlo7U0FYRDtPQURVO01BaUJYLElBQUMsQ0FBQSxLQUFLLENBQUMsSUFBUCxDQUFZLElBQVo7TUFDQSxJQUFJLENBQUMsZ0JBQUwsR0FBd0IsSUFBSSxDQUFDO0FBM0I5QjtBQTZCQTtTQUFBLHNCQUFBO1VBQTRCO3FCQUMzQixJQUFDLENBQUEsUUFBRCxDQUFVLEdBQVYsRUFBZSxJQUFDLENBQUEsVUFBVyxDQUFBLEdBQUEsQ0FBM0I7O0FBREQ7O0VBOUNXOzt3QkFpRFosY0FBQSxHQUFnQixTQUFBO0FBQ2YsUUFBQTtBQUFBO0FBQUE7U0FBQSxxQ0FBQTs7bUJBQ0MsSUFBSSxDQUFDLE9BQUwsQ0FBQTtBQUREOztFQURlOzt3QkFJaEIsYUFBQSxHQUFlLFNBQUMsSUFBRDtBQUNkLFFBQUE7SUFBQSxJQUFjLGtCQUFkO0FBQUEsYUFBQTs7SUFDQSxHQUFBLEdBQ0M7TUFBQSxLQUFBLEVBQU8sSUFBQyxDQUFBLEtBQU0sQ0FBQSxDQUFBLENBQWQ7TUFDQSxLQUFBLEVBQU8sSUFBQyxDQUFBLEtBQU0sQ0FBQSxDQUFBLENBRGQ7TUFFQSxJQUFBLEVBQU8sSUFBQyxDQUFBLEtBQU0sQ0FBQSxDQUFBLENBRmQ7TUFHQSxLQUFBLEVBQU8sSUFBQyxDQUFBLEtBQU0sQ0FBQSxDQUFBLENBSGQ7TUFJQSxLQUFBLEVBQU8sSUFBQyxDQUFBLEtBQU0sQ0FBQSxDQUFBLENBSmQ7TUFLQSxJQUFBLEVBQU8sSUFBQyxDQUFBLEtBQU0sQ0FBQSxDQUFBLENBTGQ7TUFNQSxJQUFBLEVBQU8sSUFBQyxDQUFBLEtBQU0sQ0FBQSxDQUFBLENBTmQ7TUFPQSxJQUFBLEVBQU8sSUFBQyxDQUFBLEtBQU0sQ0FBQSxDQUFBLENBUGQ7TUFRQSxHQUFBLEVBQU8sSUFBQyxDQUFBLEtBQU0sQ0FBQSxDQUFBLENBUmQ7TUFTQSxNQUFBLEVBQU8sSUFBQyxDQUFBLEtBQU0sQ0FBQSxDQUFBLENBVGQ7O0FBVUQsV0FBTyxHQUFJLENBQUEsSUFBQTtFQWJHOzt3QkFlZixRQUFBLEdBQVUsU0FBQyxJQUFELEVBQU8sU0FBUDtBQUVULFFBQUE7SUFBQSxJQUE2SixhQUFRLEtBQVIsRUFBQSxJQUFBLEtBQTdKO0FBQUEsWUFBTSxLQUFBLENBQU0sNkNBQUEsR0FBZ0QsSUFBaEQsR0FBdUQsa0ZBQTdELEVBQU47O0lBRUEsSUFBd0IsdUJBQXhCO01BQUEsSUFBQyxDQUFBLFVBQUQsR0FBYyxHQUFkOztJQUNBLElBQUMsQ0FBQSxVQUFXLENBQUEsSUFBQSxDQUFaLEdBQW9CO0lBRXBCLEtBQUEsR0FBUSxJQUFDLENBQUEsYUFBRCxDQUFlLElBQWY7SUFFUixJQUFHLGlCQUFIOztRQUNDLEtBQUssQ0FBRSxJQUFQLEdBQWM7OzZCQUNkLEtBQUssQ0FBRSxLQUFQLEdBQWUsbUJBRmhCO0tBQUEsTUFBQTs7UUFJQyxLQUFLLENBQUUsSUFBUCxtQkFBYyxLQUFLLENBQUU7OzZCQUNyQixLQUFLLENBQUUsZUFBUCxtQkFBeUIsS0FBSyxDQUFFLG1DQUxqQzs7RUFUUzs7d0JBZ0JWLFFBQUEsR0FBVSxTQUFDLElBQUQ7QUFFVCxRQUFBO0lBQUEsSUFBNkosYUFBUSxLQUFSLEVBQUEsSUFBQSxLQUE3SjtBQUFBLFlBQU0sS0FBQSxDQUFNLDZDQUFBLEdBQWdELElBQWhELEdBQXVELGtGQUE3RCxFQUFOOztJQUVBLEtBQUEsR0FBUSxJQUFDLENBQUEsYUFBRCxDQUFlLElBQWY7SUFDUixJQUFzQixhQUF0QjtBQUFBLGFBQU8sS0FBSyxDQUFDLE1BQWI7O0VBTFM7O3dCQU9WLFlBQUEsR0FBYyxTQUFDLFdBQUQ7QUFFYixRQUFBO0lBQUEsT0FBQSxHQUFVLFdBQVcsQ0FBQztJQUN0QixJQUFtQixlQUFuQjtNQUFBLE9BQUEsR0FBVSxFQUFWOztJQUVBLElBQUcsT0FBQSxJQUFXLEdBQWQ7TUFDQyxPQUFBLEdBQVUsS0FBQSxHQUFRLElBRG5CO0tBQUEsTUFFSyxJQUFHLE9BQUEsR0FBVSxDQUFiO01BQ0osSUFBQSxHQUFPLElBQUksQ0FBQyxHQUFMLENBQVMsT0FBVCxDQUFBLEdBQW9CO01BQzNCLE9BQUEsR0FBVSxHQUFBLEdBQU0sS0FGWjs7SUFJTCxTQUFBLEdBQVksV0FBVyxDQUFDO0lBQ3hCLElBQXFCLGlCQUFyQjtNQUFBLFNBQUEsR0FBWSxFQUFaOztJQUNBLFNBQUEsR0FBWSxLQUFLLENBQUMsS0FBTixDQUFZLFNBQVosRUFBdUIsQ0FBQyxFQUF4QixFQUE0QixFQUE1QjtJQUVaLFFBQUEsR0FBVyxXQUFXLENBQUM7SUFDdkIsSUFBdUIsZ0JBQXZCO01BQUEsUUFBQSxHQUFXLEtBQVg7O0lBRUEsV0FBVyxDQUFDLE9BQVosR0FBc0I7SUFDdEIsV0FBVyxDQUFDLFNBQVosR0FBd0I7SUFDeEIsV0FBVyxDQUFDLFFBQVosR0FBdUI7SUFFdkIsTUFBQSxHQUFhLElBQUEsYUFBQSxDQUFjLFdBQWQsRUFBMkIsSUFBQyxDQUFBLFFBQTVCO0lBQ2IsTUFBTSxDQUFDLFVBQVAsR0FBb0IsSUFBQyxDQUFBO0lBRXJCLElBQStCLElBQUMsQ0FBQSwwQkFBaEM7YUFBQSxJQUFDLENBQUEsTUFBRCxDQUFRLE9BQVIsRUFBaUIsU0FBakIsRUFBQTs7RUF6QmE7O3dCQTZCZCx1QkFBQSxHQUF5QixTQUFBO0FBRXhCLFFBQUE7SUFBQSxJQUFHLEtBQUssQ0FBQyxTQUFOLENBQUEsQ0FBSDtNQUNDLElBQUcsSUFBQyxDQUFBLFNBQUo7UUFDQyxJQUFHLElBQUMsQ0FBQSxtQkFBRCxLQUF3QixNQUEzQjtVQUNDLElBQUMsQ0FBQSxtQkFBRCxHQUF1QjtVQUN2QixJQUFDLENBQUEsaUJBQUQsR0FBcUI7VUFDckIsSUFBQyxDQUFBLHVCQUFELEdBQTJCO1VBQzNCLElBQUMsQ0FBQSxxQkFBRCxHQUF5QjtVQUN6QixJQUFDLENBQUEsUUFBRCxHQUFZO1VBQ1osSUFBQyxDQUFBLFVBQUQsR0FBYyxNQU5mOztRQVFBLElBQUEsR0FBVyxJQUFBLElBQUEsQ0FBQTtRQUNYLENBQUEsR0FBSTtRQUNKLElBQUcsUUFBUSxDQUFDLEVBQVQsSUFBZSxRQUFRLENBQUMsSUFBM0I7VUFDQyxJQUFBLEdBQU8sSUFBQSxHQUFPLElBQUMsQ0FBQTtVQUNmLElBQUcsSUFBQSxHQUFPLEVBQVY7WUFDQyxJQUFHLElBQUMsQ0FBQSxxQkFBRCxHQUF5QixFQUE1QjtjQUNDLElBQUMsQ0FBQSxxQkFBRCxJQUEwQixLQUQzQjthQUREOztVQUdBLElBQUcsUUFBUSxDQUFDLEVBQVo7WUFDQyxJQUFHLElBQUMsQ0FBQSxRQUFELEtBQWEsS0FBaEI7Y0FDQyxJQUFDLENBQUEscUJBQUQsR0FBeUI7Y0FDekIsSUFBQyxDQUFBLFFBQUQsR0FBWSxLQUZiOztZQUdBLElBQUMsQ0FBQSxVQUFELENBQVksQ0FBWixFQUFlLENBQUEsR0FBSSxJQUFDLENBQUEscUJBQUwsR0FBNkIsQ0FBNUMsRUFKRDtXQUFBLE1BQUE7WUFNQyxJQUFHLElBQUMsQ0FBQSxRQUFELEtBQWEsSUFBaEI7Y0FDQyxJQUFDLENBQUEscUJBQUQsR0FBeUI7Y0FDekIsSUFBQyxDQUFBLFFBQUQsR0FBWSxNQUZiOztZQUlBLElBQUMsQ0FBQSxVQUFELENBQVksQ0FBWixFQUFlLENBQUMsQ0FBRCxHQUFLLElBQUMsQ0FBQSxxQkFBTixHQUE4QixDQUE3QyxFQVZEOztVQVdBLElBQUMsQ0FBQSxpQkFBRCxHQUFxQixLQWhCdEI7U0FBQSxNQUFBO1VBbUJDLElBQUMsQ0FBQSxxQkFBRCxHQUF5QixFQW5CMUI7O1FBcUJBLElBQUcsUUFBUSxDQUFDLElBQVQsSUFBaUIsUUFBUSxDQUFDLEtBQTdCO1VBQ0MsSUFBQSxHQUFPLElBQUEsR0FBTyxJQUFDLENBQUE7VUFDZixJQUFHLElBQUEsR0FBTyxFQUFWO1lBQ0MsSUFBRyxJQUFDLENBQUEsdUJBQUQsR0FBMkIsRUFBOUI7Y0FDQyxJQUFDLENBQUEsdUJBQUQsSUFBNEIsS0FEN0I7YUFERDs7VUFHQSxJQUFHLFFBQVEsQ0FBQyxJQUFaO1lBQ0MsSUFBRyxJQUFDLENBQUEsVUFBRCxLQUFlLEtBQWxCO2NBQ0MsSUFBQyxDQUFBLHVCQUFELEdBQTJCO2NBQzNCLElBQUMsQ0FBQSxVQUFELEdBQWMsS0FGZjs7WUFHQSxJQUFDLENBQUEsVUFBRCxDQUFZLENBQUEsR0FBSSxJQUFDLENBQUEsdUJBQUwsR0FBK0IsQ0FBM0MsRUFBOEMsQ0FBOUMsRUFKRDtXQUFBLE1BQUE7WUFNQyxJQUFHLElBQUMsQ0FBQSxVQUFELEtBQWUsSUFBbEI7Y0FDQyxJQUFDLENBQUEsdUJBQUQsR0FBMkI7Y0FDM0IsSUFBQyxDQUFBLFVBQUQsR0FBYyxNQUZmOztZQUdBLElBQUMsQ0FBQSxVQUFELENBQVksQ0FBQyxDQUFELEdBQUssSUFBQyxDQUFBLHVCQUFOLEdBQWdDLENBQTVDLEVBQStDLENBQS9DLEVBVEQ7O2lCQVVBLElBQUMsQ0FBQSxtQkFBRCxHQUF1QixLQWZ4QjtTQUFBLE1BQUE7aUJBaUJDLElBQUMsQ0FBQSx1QkFBRCxHQUEyQixFQWpCNUI7U0FoQ0Q7T0FERDtLQUFBLE1Bb0RLLElBQUcsNEJBQUg7TUFFSixLQUFBLEdBQVEsSUFBQyxDQUFBLGVBQWUsQ0FBQztNQUN6QixJQUFBLEdBQU8sSUFBQyxDQUFBLGVBQWUsQ0FBQztNQUN4QixLQUFBLEdBQVEsSUFBQyxDQUFBLGVBQWUsQ0FBQztNQUV6QixJQUF3QyxLQUFBLEtBQVcsQ0FBWCxJQUFpQixJQUFBLEtBQVUsQ0FBM0IsSUFBaUMsS0FBQSxLQUFXLENBQXBGO1FBQUEsSUFBQyxDQUFBLGVBQUQsQ0FBaUIsS0FBakIsRUFBd0IsSUFBeEIsRUFBOEIsS0FBOUIsRUFBQTs7TUFFQSxJQUFDLENBQUEsS0FBSyxDQUFDLElBQVAsR0FBYyxJQUFDLENBQUE7TUFDZixJQUFDLENBQUEsS0FBSyxDQUFDLElBQVAsR0FBYyxJQUFDLENBQUE7TUFDZixJQUFDLENBQUEsS0FBSyxDQUFDLENBQVAsR0FBVyxJQUFDLENBQUE7TUFDWixJQUFDLENBQUEsS0FBSyxDQUFDLFFBQVAsR0FBa0IsQ0FBQyxJQUFDLENBQUEsUUFBRixHQUFhLElBQUMsQ0FBQTtNQUNoQyxJQUFDLENBQUEsS0FBSyxDQUFDLFNBQVAsR0FBbUIsRUFBQSxHQUFLLElBQUMsQ0FBQTthQUN6QixJQUFDLENBQUEsS0FBSyxDQUFDLFNBQVAsR0FBbUIsSUFBQyxDQUFBLE1BYmhCOztFQXREbUI7O3dCQXFFekIsZUFBQSxHQUFpQixTQUFDLEtBQUQsRUFBUSxJQUFSLEVBQWMsS0FBZDtBQUVoQixRQUFBO0lBQUEsUUFBQSxHQUFXLEtBQUEsR0FBUSxJQUFDLENBQUE7SUFDcEIsT0FBQSxHQUFVLElBQUEsR0FBTyxJQUFDLENBQUE7SUFDbEIsUUFBQSxHQUFXLEtBQUEsR0FBUSxJQUFDLENBQUE7SUFHcEIsRUFBQSxHQUFLLElBQUksQ0FBQyxHQUFMLENBQVMsUUFBVDtJQUNMLEVBQUEsR0FBSyxJQUFJLENBQUMsR0FBTCxDQUFTLFFBQVQ7SUFDTCxFQUFBLEdBQUssSUFBSSxDQUFDLEdBQUwsQ0FBUyxPQUFUO0lBQ0wsRUFBQSxHQUFLLElBQUksQ0FBQyxHQUFMLENBQVMsT0FBVDtJQUNMLEVBQUEsR0FBSyxJQUFJLENBQUMsR0FBTCxDQUFTLFFBQVQ7SUFDTCxFQUFBLEdBQUssSUFBSSxDQUFDLEdBQUwsQ0FBUyxRQUFUO0lBR0wsR0FBQSxHQUFNLENBQUMsRUFBRCxHQUFNLEVBQU4sR0FBVyxFQUFYLEdBQWdCLEVBQUEsR0FBSztJQUMzQixHQUFBLEdBQU0sRUFBQSxHQUFLLEVBQUwsR0FBVSxFQUFWLEdBQWUsRUFBQSxHQUFLO0lBQzFCLEdBQUEsR0FBTSxFQUFBLEdBQUs7SUFHWCxHQUFBLEdBQU0sQ0FBQyxFQUFELEdBQU07SUFDWixHQUFBLEdBQU0sRUFBQSxHQUFLO0lBQ1gsR0FBQSxHQUFNLENBQUM7SUFHUCxHQUFBLEdBQU0sQ0FBQyxFQUFELEdBQU0sRUFBTixHQUFXLEVBQVgsR0FBZ0IsRUFBQSxHQUFLO0lBQzNCLEdBQUEsR0FBTSxFQUFBLEdBQUssRUFBTCxHQUFVLEVBQVYsR0FBZSxFQUFBLEdBQUs7SUFDMUIsR0FBQSxHQUFNLEVBQUEsR0FBSztJQUdYLE9BQUEsR0FBVSxJQUFJLENBQUMsSUFBTCxDQUFVLEdBQUEsR0FBTSxHQUFoQjtJQUdWLElBQUcsR0FBQSxHQUFNLENBQVQ7TUFDQyxPQUFBLElBQVcsSUFBSSxDQUFDLEdBRGpCO0tBQUEsTUFFSyxJQUFHLEdBQUEsR0FBTSxDQUFUO01BQ0osT0FBQSxJQUFXLENBQUEsR0FBSSxJQUFJLENBQUMsR0FEaEI7O0lBSUwsU0FBQSxHQUFZLElBQUksQ0FBQyxFQUFMLEdBQVUsQ0FBVixHQUFjLElBQUksQ0FBQyxJQUFMLENBQVUsQ0FBQyxHQUFYO0lBRTFCLEVBQUEsR0FBSyxJQUFJLENBQUMsSUFBTCxDQUFVLENBQUEsR0FBSSxDQUFDLEdBQUEsR0FBTSxHQUFQLENBQWQ7SUFDTCxJQUFBLEdBQU8sSUFBSSxDQUFDLElBQUwsQ0FBVSxDQUFDLEdBQUQsR0FBTyxFQUFqQixDQUFBLEdBQXVCLElBQUksQ0FBQyxJQUFMLENBQVUsR0FBVjtJQUc5QixPQUFBLElBQVcsR0FBQSxHQUFNLElBQUksQ0FBQztJQUN0QixTQUFBLElBQWEsR0FBQSxHQUFNLElBQUksQ0FBQztJQUN4QixJQUFBLElBQVEsR0FBQSxHQUFNLElBQUksQ0FBQztJQUVuQixJQUFDLENBQUEsUUFBRCxHQUFZLElBQUksQ0FBQyxLQUFMLENBQVcsT0FBQSxHQUFVLElBQXJCLENBQUEsR0FBNkI7SUFDekMsSUFBQyxDQUFBLFVBQUQsR0FBYyxJQUFJLENBQUMsS0FBTCxDQUFXLFNBQUEsR0FBWSxJQUF2QixDQUFBLEdBQStCO0lBRTdDLElBQUEsR0FBTyxJQUFJLENBQUMsS0FBTCxDQUFXLElBQUEsR0FBTyxJQUFsQixDQUFBLEdBQTBCO0lBQ2pDLHFCQUFBLEdBQXdCLENBQUMsTUFBTSxDQUFDLFdBQVAsR0FBcUIsQ0FBQyxDQUF2QixDQUFBLEdBQTRCO0lBQ3BELElBQUEsSUFBUTtJQUNSLElBQWUsSUFBQSxHQUFPLEdBQXRCO01BQUEsSUFBQSxJQUFRLElBQVI7O0lBQ0EsSUFBQyxDQUFBLEtBQUQsR0FBUztJQUVULElBQUMsQ0FBQSxjQUFELEdBQWtCLElBQUMsQ0FBQTtJQUNuQixJQUFDLENBQUEsZ0JBQUQsR0FBb0IsSUFBQyxDQUFBO1dBQ3JCLElBQUMsQ0FBQSw4QkFBRCxDQUFBO0VBNURnQjs7d0JBZ0VqQix1QkFBQSxHQUF5QixTQUFBO0FBQ3hCLFFBQUE7SUFBQSxNQUFBLEdBQVMsS0FBSyxDQUFDLHVCQUFOLENBQThCO01BQUMsQ0FBQSxFQUFFLENBQUg7TUFBTSxDQUFBLEVBQUUsQ0FBUjtLQUE5QixFQUEwQyxJQUExQyxFQUE2QyxJQUE3QztJQUNULE1BQUEsR0FBUyxLQUFLLENBQUMsdUJBQU4sQ0FBOEI7TUFBQyxDQUFBLEVBQUUsQ0FBSDtNQUFNLENBQUEsRUFBRSxDQUFSO0tBQTlCLEVBQTBDLElBQTFDLEVBQTZDLElBQTdDO0lBQ1QsS0FBQSxHQUFRLElBQUksQ0FBQyxHQUFMLENBQVMsTUFBTSxDQUFDLENBQVAsR0FBVyxNQUFNLENBQUMsQ0FBM0I7SUFDUixLQUFBLEdBQVEsSUFBSSxDQUFDLEdBQUwsQ0FBUyxNQUFNLENBQUMsQ0FBUCxHQUFXLE1BQU0sQ0FBQyxDQUEzQjtBQUNSLFdBQU87TUFBQyxDQUFBLEVBQUUsS0FBSDtNQUFVLENBQUEsRUFBRSxLQUFaOztFQUxpQjs7d0JBT3pCLFFBQUEsR0FBVSxTQUFDLE9BQUQ7SUFFVCxJQUFDLENBQUEsT0FBRCxHQUFXO0lBQ1gsSUFBQyxDQUFBLFVBQUQsQ0FBWSxDQUFaLEVBQWUsQ0FBZjtJQUVBLElBQUMsQ0FBQSxXQUFELENBQWEsQ0FBQSxTQUFBLEtBQUE7YUFBQSxTQUFBO2VBQUcsS0FBQyxDQUFBLFdBQUQsQ0FBQTtNQUFIO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFiO0lBRUEsSUFBQyxDQUFBLEtBQUQsQ0FBTyxDQUFBLFNBQUEsS0FBQTthQUFBLFNBQUMsSUFBRDtBQUNOLFlBQUE7UUFBQSxJQUFVLENBQUksS0FBQyxDQUFBLE9BQWY7QUFBQSxpQkFBQTs7UUFDQSxLQUFBLEdBQVEsS0FBQyxDQUFBLHVCQUFELENBQUE7UUFDUixNQUFBLEdBQVMsSUFBSSxDQUFDLE1BQUwsR0FBYyxLQUFLLENBQUM7UUFDN0IsTUFBQSxHQUFTLElBQUksQ0FBQyxNQUFMLEdBQWMsS0FBSyxDQUFDO1FBQzdCLFFBQUEsR0FBVyxLQUFLLENBQUMsUUFBTixDQUFlLEtBQUMsQ0FBQSxXQUFoQixFQUE2QixDQUFDLElBQUQsRUFBTyxHQUFQLENBQTdCLEVBQTBDLENBQUMsRUFBRCxFQUFLLElBQUwsQ0FBMUM7UUFFWCxJQUFHLEtBQUssQ0FBQyxRQUFOLENBQUEsQ0FBSDtVQUNDLElBQTBDLEtBQUMsQ0FBQSxhQUEzQztZQUFBLEtBQUMsQ0FBQSxjQUFELElBQW9CLE1BQUEsR0FBUyxTQUE3QjtXQUREO1NBQUEsTUFBQTtVQUdDLEtBQUMsQ0FBQSxVQUFELENBQVksTUFBQSxHQUFTLFFBQXJCLEVBQStCLE1BQUEsR0FBUyxRQUF4QyxFQUhEOztRQUtBLEtBQUMsQ0FBQSxVQUFELEdBQWMsSUFBSSxDQUFDO2VBQ25CLEtBQUMsQ0FBQSxVQUFELEdBQWMsSUFBSSxDQUFDO01BYmI7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQVA7V0FlQSxJQUFDLENBQUEsUUFBRCxDQUFVLENBQUEsU0FBQSxLQUFBO2FBQUEsU0FBQyxJQUFEO0FBQ1QsWUFBQTtRQUFBLElBQVUsQ0FBSSxLQUFDLENBQUEsT0FBTCxJQUFnQixLQUFLLENBQUMsUUFBTixDQUFBLENBQTFCO0FBQUEsaUJBQUE7O1FBQ0EsS0FBQSxHQUFRLEtBQUMsQ0FBQSx1QkFBRCxDQUFBO1FBQ1IsU0FBQSxHQUFZLENBQUMsSUFBSSxDQUFDLFNBQUwsR0FBaUIsS0FBQyxDQUFBLFVBQW5CLENBQUEsR0FBaUM7UUFDN0MsU0FBQSxHQUFZLENBQUMsSUFBSSxDQUFDLFNBQUwsR0FBaUIsS0FBQyxDQUFBLFVBQW5CLENBQUEsR0FBaUM7UUFDN0MsU0FBQSxJQUFhO1FBQ2IsU0FBQSxJQUFhO1FBQ2IsU0FBQSxJQUFhLEtBQUssQ0FBQztRQUNuQixTQUFBLElBQWEsS0FBSyxDQUFDO1FBQ25CLFFBQUEsR0FBVyxLQUFLLENBQUMsUUFBTixDQUFlLEtBQUMsQ0FBQSxXQUFoQixFQUE2QixDQUFDLElBQUQsRUFBTyxHQUFQLENBQTdCLEVBQTBDLENBQUMsRUFBRCxFQUFLLElBQUwsQ0FBMUM7UUFDWCxJQUFBLEdBQU8sSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUFJLENBQUMsSUFBTCxDQUFVLFNBQUEsR0FBWSxTQUF0QixDQUFBLEdBQW1DLENBQTlDLENBQUEsR0FBbUQ7ZUFDMUQsS0FBQyxDQUFBLE9BQUQsQ0FDQztVQUFBLFVBQUEsRUFDQztZQUFBLE9BQUEsRUFBUyxLQUFDLENBQUEsT0FBRCxHQUFXLENBQUMsSUFBSSxDQUFDLFNBQUwsR0FBaUIsS0FBSyxDQUFDLENBQXZCLEdBQTJCLEdBQTVCLENBQUEsR0FBbUMsUUFBdkQ7WUFDQSxTQUFBLEVBQVcsS0FBQyxDQUFBLFNBQUQsR0FBYSxDQUFDLElBQUksQ0FBQyxTQUFMLEdBQWlCLEtBQUssQ0FBQyxDQUF2QixHQUEyQixHQUE1QixDQUFBLEdBQW1DLFFBRDNEO1dBREQ7VUFHQSxLQUFBLEVBQU8sbUJBQUEsR0FBb0IsSUFBcEIsR0FBeUIsR0FIaEM7U0FERDtNQVhTO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFWO0VBdEJTOzt3QkF1Q1YsVUFBQSxHQUFZLFNBQUMsUUFBRCxFQUFXLFdBQVg7QUFDWCxRQUFBO0lBQUEsWUFBQSxHQUFlLElBQUMsQ0FBQSxRQUFELEdBQVU7SUFDekIsSUFBQyxDQUFBLFFBQUQsSUFBYTtJQUViLElBQUcsSUFBQyxDQUFBLFFBQUQsR0FBWSxHQUFmO01BQ0MsSUFBQyxDQUFBLFFBQUQsSUFBYSxJQURkO0tBQUEsTUFFSyxJQUFHLElBQUMsQ0FBQSxRQUFELEdBQVksQ0FBZjtNQUNKLElBQUMsQ0FBQSxRQUFELElBQWEsSUFEVDs7SUFHTCxJQUFDLENBQUEsVUFBRCxJQUFlO0lBQ2YsSUFBQyxDQUFBLFVBQUQsR0FBYyxLQUFLLENBQUMsS0FBTixDQUFZLElBQUMsQ0FBQSxVQUFiLEVBQXlCLENBQUMsRUFBMUIsRUFBOEIsRUFBOUI7SUFFZCxJQUFDLENBQUEsS0FBSyxDQUFDLElBQVAsR0FBYyxJQUFDLENBQUE7SUFDZixJQUFDLENBQUEsS0FBSyxDQUFDLElBQVAsR0FBYyxJQUFDLENBQUE7SUFDZixJQUFDLENBQUEsS0FBSyxDQUFDLENBQVAsR0FBVyxJQUFDLENBQUE7SUFDWixJQUFDLENBQUEsS0FBSyxDQUFDLFNBQVAsR0FBbUIsRUFBQSxHQUFLLElBQUMsQ0FBQTtJQUN6QixJQUFDLENBQUEsS0FBSyxDQUFDLFFBQVAsR0FBa0IsQ0FBQyxJQUFDLENBQUEsUUFBRixHQUFhLElBQUMsQ0FBQTtXQUVoQyxJQUFDLENBQUEsOEJBQUQsQ0FBQTtFQWxCVzs7d0JBb0JaLE1BQUEsR0FBUSxTQUFDLE9BQUQsRUFBVSxTQUFWO0lBRVAsSUFBQyxDQUFBLEtBQUssQ0FBQyxJQUFQLEdBQWMsSUFBQyxDQUFBO0lBQ2YsSUFBQyxDQUFBLEtBQUssQ0FBQyxJQUFQLEdBQWMsSUFBQyxDQUFBO0lBQ2YsSUFBQyxDQUFBLEtBQUssQ0FBQyxDQUFQLEdBQVcsSUFBQyxDQUFBO0lBQ1osSUFBQyxDQUFBLEtBQUssQ0FBQyxTQUFQLEdBQW1CLEVBQUEsR0FBSyxJQUFDLENBQUE7SUFDekIsSUFBQyxDQUFBLEtBQUssQ0FBQyxRQUFQLEdBQWtCLENBQUMsSUFBQyxDQUFBO0lBQ3BCLElBQUMsQ0FBQSxLQUFLLENBQUMsU0FBUCxHQUFtQixJQUFDLENBQUE7SUFFcEIsSUFBQyxDQUFBLFFBQUQsR0FBWTtJQUNaLElBQUMsQ0FBQSxVQUFELEdBQWM7SUFDZCxJQUFpRCxLQUFLLENBQUMsUUFBTixDQUFBLENBQWpEO01BQUEsSUFBQyxDQUFBLGNBQUQsR0FBa0IsSUFBQyxDQUFBLFFBQUQsR0FBWSxJQUFDLENBQUEsZUFBL0I7O0lBQ0EsSUFBQyxDQUFBLGdCQUFELEdBQW9CLElBQUMsQ0FBQSxVQUFELEdBQWMsSUFBQyxDQUFBO0lBRW5DLE9BQUEsR0FBVSxJQUFDLENBQUE7SUFDWCxJQUFHLE9BQUEsR0FBVSxDQUFiO01BQ0MsT0FBQSxJQUFXLElBRFo7S0FBQSxNQUVLLElBQUcsT0FBQSxHQUFVLEdBQWI7TUFDSixPQUFBLElBQVcsSUFEUDs7V0FHTCxJQUFDLENBQUEsOEJBQUQsQ0FBQTtFQXBCTzs7d0JBc0JSLDhCQUFBLEdBQWdDLFNBQUE7V0FDL0IsSUFBQyxDQUFBLElBQUQsQ0FBTSxNQUFNLENBQUMsb0JBQWIsRUFBbUM7TUFBQyxPQUFBLEVBQVMsSUFBQyxDQUFBLE9BQVg7TUFBb0IsU0FBQSxFQUFXLElBQUMsQ0FBQSxTQUFoQztNQUEyQyxJQUFBLEVBQU0sSUFBQyxDQUFBLElBQWxEO0tBQW5DO0VBRCtCOzt3QkFLaEMsbUJBQUEsR0FBb0IsU0FBQyxFQUFEO1dBQVEsSUFBQyxDQUFBLEVBQUQsQ0FBSSxNQUFNLENBQUMsb0JBQVgsRUFBaUMsRUFBakM7RUFBUjs7OztHQXBkYTs7OztBRHBJbEMsT0FBTyxDQUFDLEtBQVIsR0FBZ0I7O0FBRWhCLE9BQU8sQ0FBQyxVQUFSLEdBQXFCLFNBQUE7U0FDcEIsS0FBQSxDQUFNLHVCQUFOO0FBRG9COztBQUdyQixPQUFPLENBQUMsT0FBUixHQUFrQixDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCJ9
