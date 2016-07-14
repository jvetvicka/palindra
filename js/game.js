
/* Game namespace */
var game = {

    // an object where to store game information
    data : {
        // score
        score: 0,
        Playerhealth: 0,
        Playerjumppower: 0,
        Usegun:false,
    },


    // Run on page load.
    "onload": function () {
        // Initialize the video.
        if (!me.video.init(1024, 740, {wrapper : "screen", scale : "none"})) {
            alert("Your browser does not support HTML5 canvas.");
            return;
        }

        // add "#debug" to the URL to enable the debug Panel
        if (me.game.HASH.debug === true) {
            window.onReady(function () {
                me.plugin.register.defer(this, me.debug.Panel, "debug", me.input.KEY.V);
            });
        }

        // Initialize the audio.
        me.audio.init("mp3,ogg");

        // set and load all resources.
        // (this will also automatically switch to the loading screen)
        me.loader.preload(game.resources, this.loaded.bind(this));
    },

    // Run on game resources loaded.
    "loaded" : function () {
        me.state.set(me.state.MENU, new game.TitleScreen());
        me.state.set(me.state.PLAY, new game.PlayScreen());

        // add our player entity in the entity pool
        me.pool.register("mainPlayer", game.PlayerEntity);
        me.pool.register("CoinEntity", game.CoinEntity);
        me.pool.register("EnemyFrog", game.EnemyFrog);
        me.pool.register("EnemyFly", game.EnemyFly);
        me.pool.register("GunEntity", game.GunEntity);

        // enable the keyboard
        me.input.bindKey(me.input.KEY.LEFT, "left");
        me.input.bindKey(me.input.KEY.RIGHT, "right");
        me.input.bindKey(me.input.KEY.UP, "jump", true);


        // Start the game.
        me.state.change(me.state.PLAY);
    },

    "levelrest": function () {
        me.levelDirector.reloadLevel();
        this.data.score = 0;
        this.data.Playerhealth = 100;
        this.loaded();

    },

    "onRestart": function () {

    }


};
