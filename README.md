jw6ss
=====

comScore StreamSense plugin for [JW Player 6](http://www.jwplayer.com/)

Usage
-----

First, include the .js file in your HTML. This has to be done *after* including the JW Player and StreamSense JavaScript files:

    <!-- JW Player 6 -->
    <script type='text/javascript' src='http://jwpsrv.com/library/x_xxxxxxxxxxxxxxxxxxxxxx.js'></script>
    <!-- StreamSense -->
    <script type='text/javascript' src='/streamsense.min.js'></script>
    <!-- This library -->
    <script type='text/javascript' src='/jw6ss.js'></script>

If there's only one player in the whole page, you can use the short initialization:

    JW6SS.observe()

In case you have more, you can specify which player you want to observe:

    var p = jwplayer('main-player');
    JW6SS.observe(p);

Build from Source
-----------------

This library is coded in [CoffeeScript](http://coffeescript.org/), with compiled js bundled in the `dist` folder. In case you want to manually build it (ie. you made some modifications), first install CoffeeScript:

    npm -g install coffee-script

Then run the compiler (this will keep the compiler watching for changes inside the `src` directory):

    coffee -o dist -cw src

Generate Documentation
----------------------

The source code is heavily documented (well, not heavily, but i'm trying to do so) in a Literate way. You can find the documentation inside the `docs` folder.

Of course you can re-generate with [Docco](http://jashkenas.github.io/docco/):

    npm -g install docco

And running the following command:

    docco -o docs src\jw6ss.coffee