'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @fileOverview Source for binaural processing.
 * @author Jean-Philippe.Lambert@ircam.fr
 * @copyright 2016 IRCAM, Paris, France
 * @license BSD-3-Clause
 */

/**
 * Single source.
 *
 * @see BinauralPanner
 */

var Source = exports.Source = function () {
  function Source() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Source);

    this._audioContext = options.audioContext;
    this._hrtfSet = options.hrtfSet;

    this._convolverCurrent = this._audioContext.createConvolver();
    this._convolverCurrent.normalize = false;

    this._gainCurrent = this._audioContext.createGain();
    this._convolverCurrent.connect(this._gainCurrent);

    this._convolverNext = this._audioContext.createConvolver();
    this._convolverNext.normalize = false;

    this._gainNext = this._audioContext.createGain();
    this._convolverNext.connect(this._gainNext);

    this.crossfadeDuration = options.crossfadeDuration;

    this._crossfadeAfterTime = this._audioContext.currentTime;
    this._crossfadeTimeout = undefined;

    // set position when everything is ready
    if (typeof options.position !== 'undefined') {
      this.position = options.position;
    }
  }

  // ----------- accessors

  _createClass(Source, [{
    key: 'connectInput',

    // ----------- public methods

    value: function connectInput(nodesToConnect, output, input) {
      var _this = this;

      var nodes = Array.isArray(nodesToConnect) ? nodesToConnect : [nodesToConnect]; // make array

      nodes.forEach(function (node) {
        node.connect(_this._convolverCurrent, output, input);
        node.connect(_this._convolverNext, output, input);
      });

      return this;
    }
  }, {
    key: 'disconnectInput',
    value: function disconnectInput(nodesToDisconnect) {
      var _this2 = this;

      var nodes = Array.isArray(nodesToDisconnect) ? nodesToDisconnect : [nodesToDisconnect]; // make array

      nodes.forEach(function (node) {
        node.disconnect(_this2._convolverCurrent);
        node.disconnect(_this2._convolverNext);
      });

      return this;
    }
  }, {
    key: 'connectOutput',
    value: function connectOutput(nodesToConnect, output, input) {
      var _this3 = this;

      var nodes = Array.isArray(nodesToConnect) ? nodesToConnect : [nodesToConnect]; // make array

      nodes.forEach(function (node) {
        _this3._gainCurrent.connect(node, output, input);
        _this3._gainNext.connect(node, output, input);
      });

      return this;
    }
  }, {
    key: 'disconnectOutput',
    value: function disconnectOutput(nodesToDisconnect) {
      var _this4 = this;

      if (typeof nodesToDisconnect === 'undefined') {
        // disconnect all
        this._gainCurrent.disconnect();
        this._gainNext.disconnect();
      } else {
        var nodes = Array.isArray(nodesToDisconnect) ? nodesToDisconnect : [nodesToDisconnect]; // make array

        nodes.forEach(function (node) {
          _this4._gainCurrent.disconnect(node);
          _this4._gainNext.disconnect(node);
        });
      }

      return this;
    }
  }, {
    key: 'crossfadeDuration',
    set: function set() {
      var duration = arguments.length <= 0 || arguments[0] === undefined ? 0.02 : arguments[0];

      this._crossfadeDuration = duration;
    },
    get: function get() {
      return this._crossfadeDuration;
    }
  }, {
    key: 'hrtfSet',
    set: function set(hrtfSet) {
      this._hrtfSet = hrtfSet;
    },
    get: function get() {
      return this._hrtfSet;
    }
  }, {
    key: 'position',
    set: function set(positionRequest) {
      var _this5 = this;

      clearTimeout(this._crossfadeTimeout);
      var now = this._audioContext.currentTime;
      if (now >= this._crossfadeAfterTime) {
        this._crossfadeAfterTime = now + this._crossfadeDuration;

        // swap
        var tmp = this._convolverCurrent;
        this._convolverCurrent = this._convolverNext;
        this._convolverNext = tmp;

        tmp = this._gainCurrent;
        this._gainCurrent = this._gainNext;
        this._gainNext = tmp;

        this._convolverNext.buffer = this._hrtfSet.nearestFir(positionRequest);

        // fade in next
        this._gainNext.gain.cancelScheduledValues(now);
        this._gainNext.gain.setValueAtTime(0, now);
        this._gainNext.gain.linearRampToValueAtTime(1, now + this._crossfadeDuration);

        // fade out current
        this._gainCurrent.gain.cancelScheduledValues(now);
        this._gainCurrent.gain.setValueAtTime(1, now);
        this._gainCurrent.gain.linearRampToValueAtTime(0, now + this._crossfadeDuration);
      } else {
        // re-schedule later
        this._crossfadeTimeout = setTimeout(function () {
          _this5.position = positionRequest;
        }, 0.02);
      }
    }
  }]);

  return Source;
}();

exports.default = Source;