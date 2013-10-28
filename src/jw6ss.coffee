# This CoffeScript / JavaScript library allows you to track JW Player 6 events
# using Comscore StreamSense.

# The JW6SS Class is our namespace-like container, to avoid the global scope
# pollution.

class JW6SS

  # The *Observe* class method provides a shorthand utility to start reporting
  # player events.

  # It just takes one argument, a *JW Player* instance, and if it isn't provided
  # it will call the `jwplayer()` function.

  # It returns a `Reporter` instance, so you can store it for later use.

  @observe: (jw = jwplayer())=>

    # Create a `ns_.StreamSense` instance.

    ss = new ns_.StreamSense

    # Create a new `Reporter` object.

    reporter = new @Reporter jw, ss

    # Start reporting inmediately! As the `observe()` instance method from
    # `Reporter` class returns `this`, this last line will return the
    # forementioned `Reporter` instance.

    reporter.observe()


# This is the main Class for the library, it handles the mapping between player
# events and *StreamSense* events, and keeps updated all the variables the
# latter needs to report.

class JW6SS.Reporter

  # Define some internal states as Class properties. This is needed because of
  # how JW fires *Seeking * events (we will get onto this later on). While just
  # `States.SEEKING` is really needed, we define other basic states for the sake
  # of completeness.

  @States:
    IDLE:    0
    PLAYING: 1
    PAUSED:  2
    SEEKING:  3

  # `Reporter` provides debugging information for every event, modification and
  # notification. Defining `loggingEnabled` to `true` will use `console.log` to
  # output this information.

  loggingEnabled: false

  # This private variable stores the current Player status, *idle* by default.

  _state = @States.IDLE

  # When a seeking event is fired, we will store its target offset in this
  # variable.

  _seekOffset = null



  constructor: (@jw, @ss)->
    if @jw.config.streamsense? and @jw.config.streamsense.loggingEnabled?
      @loggingEnabled = @jw.config.streamsense.loggingEnabled

  log: ()->
    if @loggingEnabled and console? and console.log?
      console.log.apply console, arguments

  observe: ()->
    @resetPlayer()

    @jw.onVolume (e)=>
      @log '[JW6SS::JW6] onVolume event fired', e
      @resetPlayer()

    @jw.onMute (e)=>
      @log '[JW6SS::JW6] onMute event fired', e
      @resetPlayer()

    @jw.onFullscreen (e)=>
      @log '[JW6SS::JW6] onFullscreen event fired', e
      @resetPlayer()

    @jw.onPlaylist (e)=>
      @log '[JW6SS::JW6] onPlaylist event fired', e
      @resetPlaylist()

    @jw.onPlaylistItem (e)=>
      @log '[JW6SS::JW6] onPlaylistItem event fired', e
      @resetClipLabels()

    @jw.onPlaylistComplete (e)=>
      @log '[JW6SS::JW6] onPlaylistComplete event fired', e

      @notify ns_.StreamSense.PlayerEvents.END,
        ns_st_pe: 1

    @jw.onPlay (e)=>
      @log '[JW6SS::JW6] onPlay event fired', e

      @updateClipLabels()

      labels = {}
      seconds = null

      if _state is @constructor.States.SEEKING
        labels.ns_st_ui = 'seeking'
        seconds = _seekOffset

      @notify ns_.StreamSense.PlayerEvents.PLAY, labels, seconds

      _seekOffset = null
      _state = @constructor.States.PLAYING

    @jw.onPause (e)=>
      @log '[JW6SS::JW6] onPause event fired', e

      @notify ns_.StreamSense.PlayerEvents.PAUSE

      _state = @constructor.States.PAUSED

    @jw.onBuffer (e)=>
      @log '[JW6SS::JW6] onBuffer event fired', e

      # Only notify Buffering when starting a new clip.
      # This *needs* to be done to avoid Seeking being reported as a Buffering
      # event. Downside: We are losing buffering events during playback. :(

      if @jw.getPosition() is 0 and e.oldstate is "IDLE"
        @notify ns_.StreamSense.PlayerEvents.BUFFER

    @jw.onIdle (e)=>
      @log '[JW6SS::JW6] onIdle event fired', e

      _state = @constructor.States.IDLE


    @jw.onComplete (e)=>
      @log '[JW6SS::JW6] onComplete event fired', e

      @notify ns_.StreamSense.PlayerEvents.END

      _state = @constructor.States.IDLE


    @jw.onSeek (e)=>
      @log '[JW6SS::JW6] onSeek event fired', e

      @notify ns_.StreamSense.PlayerEvents.PAUSE,
          ns_st_ui: 'seeking'
        , e.position

      _state = @constructor.States.SEEKING

      # Note the actual position the player will eventually seek to may differ,
      # e.g. because Flash progressive can only seek to keyframes and HLS can
      # only seek to fragment boundaries.
      #
      # http://www.longtailvideo.com/support/jw-player/28851/javascript-api-reference

      _seekOffset = e.offset

    @jw.onError (e)=>
      @log '[JW6SS::JW6] error event fired', e

      @notify ns_.StreamSense.PlayerEvents.END

    return @


  generatePlayerLabels: ()->
    labels =
      ns_st_mp: "JW Player"
      ns_st_mv: jwplayer.version
      #ns_st_it: not provided by JW
      #ns_st_br: not provided by JW
      ns_st_ws: if @jw.isFullscreen then 'full' else 'norm'
      ns_st_vo: @jw.getVolume() || 100

    if @jw.config.streamsense? and @jw.config.streamsense.player?
      labels extends @jw.config.streamsense.persistent

    return labels

  resetPlayer: ()->
    labels = @generatePlayerLabels()
    @ss.setLabels labels

    @log '[JW6SS] resetted persistent labels', labels


  generatePlaylistLabels: ()->
    labels =
      ns_st_pl: @jw.config.title
      #ns_st_ca: not provided by JW
      ns_st_cp: @jw.getPlaylist().length

    if @jw.config.streamsense? and @jw.config.streamsense.playlist?
      labels extends @jw.config.streamsense.playlist

    return labels

  resetPlaylist: ()->
    labels = @generatePlaylistLabels()
    @ss.setPlaylist labels

    @log '[JW6SS] updated playlist labels', labels

  generateClipLabels: ()->
    clip = @jw.getPlaylistItem()

    clipDuration = @jw.getDuration()
    clipLength = if clipDuration > 0 then clipDuration * 1000 else 0
    clipURL = clip.file.split('?').shift()

    labels =
      ns_st_cn: @jw.getPlaylistIndex() + 1
      ns_st_ci: generateHash clipURL
      ns_st_cl: clipLength
      ns_st_pn: 1
      ns_st_tp: 1
      ns_st_el: clipLength
      ns_st_pr: clip.title
      #ns_st_ep: not provided by JW
      #ns_st_ty: not provided by JW
      #ns_st_ge: not provided by JW
      #ns_st_de: not provided by JW
      #ns_st_pu: not provided by JW
      #ns_st_dt: not provided by JW
      #ns_st_st: not provided by JW
      #ns_st_fee: not provided by JW
      #ns_st_ad: not provided by JW
      #ns_st_li: not provided by JW
      #ns_st_cs: not provided by JW
      ns_st_cu: clipURL

    if clip.streamsense?
      labels extends clip.streamsense

    return labels

  resetClipLabels: ()->
    labels = @generateClipLabels()
    @ss.setClip labels

    @log '[JW6SS] resetted clip labels', labels

  updateClipLabels: ()->
    labels = @generateClipLabels()
    @ss.getClip().setLabels labels

    @log '[JW6SS] updated clip labels', labels


  notify: (state, labels = {}, seconds = @jw.getPosition())->
    @log "[JW6SS::StreamSense] notifying event", state, labels, seconds
    @ss.notify state, labels, seconds * 1000


generateHash = (s) ->
  h = 0

  if s.length is 0
   return h

  for i in [0...s.length]
    do (i)->
      c = s.charCodeAt i
      h = ((h<<5)-h)+c
      h |= 0

  return Math.abs(h).toString(36)

# Export global module
window.JW6SS = JW6SS