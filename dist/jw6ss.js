// Generated by CoffeeScript 1.6.3
(function() {
  var JW6SS, generateHash,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  JW6SS = (function() {
    function JW6SS() {}

    JW6SS.observe = function(jw) {
      var reporter, ss;
      if (jw == null) {
        jw = jwplayer();
      }
      ss = new ns_.StreamSense;
      reporter = new JW6SS.Reporter(jw, ss);
      return reporter.observe();
    };

    return JW6SS;

  }).call(this);

  JW6SS.Reporter = (function() {
    var _seekOffset, _state;

    Reporter.States = {
      IDLE: 0,
      PLAYING: 1,
      PAUSED: 2,
      SEEKING: 3
    };

    Reporter.prototype.loggingEnabled = false;

    _state = Reporter.States.IDLE;

    _seekOffset = null;

    function Reporter(jw, ss) {
      this.jw = jw;
      this.ss = ss;
      if ((this.jw.config.streamsense != null) && (this.jw.config.streamsense.loggingEnabled != null)) {
        this.loggingEnabled = this.jw.config.streamsense.loggingEnabled;
      }
    }

    Reporter.prototype.log = function() {
      if (this.loggingEnabled && (typeof console !== "undefined" && console !== null) && (console.log != null)) {
        return console.log.apply(console, arguments);
      }
    };

    Reporter.prototype.observe = function() {
      var _this = this;
      this.resetPlayer();
      this.jw.onVolume(function(e) {
        _this.log('[JW6SS::JW6] onVolume event fired', e);
        return _this.resetPlayer();
      });
      this.jw.onMute(function(e) {
        _this.log('[JW6SS::JW6] onMute event fired', e);
        return _this.resetPlayer();
      });
      this.jw.onFullscreen(function(e) {
        _this.log('[JW6SS::JW6] onFullscreen event fired', e);
        return _this.resetPlayer();
      });
      this.jw.onPlaylist(function(e) {
        _this.log('[JW6SS::JW6] onPlaylist event fired', e);
        return _this.resetPlaylist();
      });
      this.jw.onPlaylistItem(function(e) {
        _this.log('[JW6SS::JW6] onPlaylistItem event fired', e);
        return _this.resetClipLabels();
      });
      this.jw.onPlaylistComplete(function(e) {
        _this.log('[JW6SS::JW6] onPlaylistComplete event fired', e);
        return _this.notify(ns_.StreamSense.PlayerEvents.END, {
          ns_st_pe: 1
        });
      });
      this.jw.onPlay(function(e) {
        var labels, seconds;
        _this.log('[JW6SS::JW6] onPlay event fired', e);
        _this.updateClipLabels();
        labels = {};
        seconds = null;
        if (_state === _this.constructor.States.SEEKING) {
          labels.ns_st_ui = 'seeking';
          seconds = _seekOffset;
        }
        _this.notify(ns_.StreamSense.PlayerEvents.PLAY, labels, seconds);
        _seekOffset = null;
        return _state = _this.constructor.States.PLAYING;
      });
      this.jw.onPause(function(e) {
        _this.log('[JW6SS::JW6] onPause event fired', e);
        _this.notify(ns_.StreamSense.PlayerEvents.PAUSE);
        return _state = _this.constructor.States.PAUSED;
      });
      this.jw.onBuffer(function(e) {
        _this.log('[JW6SS::JW6] onBuffer event fired', e);
        if (_this.jw.getPosition() === 0 && e.oldstate === "IDLE") {
          return _this.notify(ns_.StreamSense.PlayerEvents.BUFFER);
        }
      });
      this.jw.onIdle(function(e) {
        _this.log('[JW6SS::JW6] onIdle event fired', e);
        return _state = _this.constructor.States.IDLE;
      });
      this.jw.onComplete(function(e) {
        _this.log('[JW6SS::JW6] onComplete event fired', e);
        _this.notify(ns_.StreamSense.PlayerEvents.END);
        return _state = _this.constructor.States.IDLE;
      });
      this.jw.onSeek(function(e) {
        _this.log('[JW6SS::JW6] onSeek event fired', e);
        _this.notify(ns_.StreamSense.PlayerEvents.PAUSE, {
          ns_st_ui: 'seeking'
        }, e.position);
        _state = _this.constructor.States.SEEKING;
        return _seekOffset = e.offset;
      });
      this.jw.onError(function(e) {
        _this.log('[JW6SS::JW6] error event fired', e);
        return _this.notify(ns_.StreamSense.PlayerEvents.END);
      });
      return this;
    };

    Reporter.prototype.generatePlayerLabels = function() {
      var labels;
      labels = {
        ns_st_mp: "JW Player",
        ns_st_mv: jwplayer.version,
        ns_st_ws: this.jw.isFullscreen ? 'full' : 'norm',
        ns_st_vo: this.jw.getVolume() || 100
      };
      if ((this.jw.config.streamsense != null) && (this.jw.config.streamsense.player != null)) {
        __extends(labels, this.jw.config.streamsense.persistent);
      }
      return labels;
    };

    Reporter.prototype.resetPlayer = function() {
      var labels;
      labels = this.generatePlayerLabels();
      this.ss.setLabels(labels);
      return this.log('[JW6SS] resetted persistent labels', labels);
    };

    Reporter.prototype.generatePlaylistLabels = function() {
      var labels;
      labels = {
        ns_st_pl: this.jw.config.title,
        ns_st_cp: this.jw.getPlaylist().length
      };
      if ((this.jw.config.streamsense != null) && (this.jw.config.streamsense.playlist != null)) {
        __extends(labels, this.jw.config.streamsense.playlist);
      }
      return labels;
    };

    Reporter.prototype.resetPlaylist = function() {
      var labels;
      labels = this.generatePlaylistLabels();
      this.ss.setPlaylist(labels);
      return this.log('[JW6SS] updated playlist labels', labels);
    };

    Reporter.prototype.generateClipLabels = function() {
      var clip, clipDuration, clipLength, clipURL, labels;
      clip = this.jw.getPlaylistItem();
      clipDuration = this.jw.getDuration();
      clipLength = clipDuration > 0 ? clipDuration * 1000 : 0;
      clipURL = clip.file.split('?').shift();
      labels = {
        ns_st_cn: this.jw.getPlaylistIndex() + 1,
        ns_st_ci: generateHash(clipURL),
        ns_st_cl: clipLength,
        ns_st_pn: 1,
        ns_st_tp: 1,
        ns_st_el: clipLength,
        ns_st_pr: clip.title,
        ns_st_cu: clipURL
      };
      if (clip.streamsense != null) {
        __extends(labels, clip.streamsense);
      }
      return labels;
    };

    Reporter.prototype.resetClipLabels = function() {
      var labels;
      labels = this.generateClipLabels();
      this.ss.setClip(labels);
      return this.log('[JW6SS] resetted clip labels', labels);
    };

    Reporter.prototype.updateClipLabels = function() {
      var labels;
      labels = this.generateClipLabels();
      this.ss.getClip().setLabels(labels);
      return this.log('[JW6SS] updated clip labels', labels);
    };

    Reporter.prototype.notify = function(state, labels, seconds) {
      if (labels == null) {
        labels = {};
      }
      if (seconds == null) {
        seconds = this.jw.getPosition();
      }
      this.log("[JW6SS::StreamSense] notifying event", state, labels, seconds);
      return this.ss.notify(state, labels, seconds * 1000);
    };

    return Reporter;

  })();

  generateHash = function(s) {
    var h, i, _fn, _i, _ref;
    h = 0;
    if (s.length === 0) {
      return h;
    }
    _fn = function(i) {
      var c;
      c = s.charCodeAt(i);
      h = ((h << 5) - h) + c;
      return h |= 0;
    };
    for (i = _i = 0, _ref = s.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      _fn(i);
    }
    return Math.abs(h).toString(36);
  };

  window.JW6SS = JW6SS;

}).call(this);
