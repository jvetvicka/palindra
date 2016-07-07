/**
 * a HUD container and child items
 */

game.HUD = game.HUD || {};


game.HUD.Container = me.Container.extend({

    init: function() {
        // call the constructor
        this._super(me.Container, 'init');

        // persistent across level change
        this.isPersistent = true;

        // make sure we use screen coordinates
        this.floating = true;
		
        // give a name
        this.name = "HUD";

        // add our child score object at the right-bottom position
        this.addChild(new game.HUD.ScoreItem(930, 600));
        this.addChild(new game.HUD.HelthItem(30, 40));
    }

});


/**
 * a basic HUD item to display score
 */
game.HUD.ScoreItem = me.Renderable.extend({
    /**
     * constructor
     */
    init : function (x, y) {
        // call the parent constructor
        // (size does not matter here)
        this._super(me.Renderable, 'init', [x, y, 10, 10]);

        // create a font
        this.font = new me.BitmapFont("32x32_font", 32);
        this.font.set("right");


        // local copy of the global score
        this.score = -1;
    },

    /**
     * update function
     */
    update : function (dt) {
        // we don't do anything fancy here, so just
        // return true if the score has been updated
        if (this.score !== game.data.score) {
            this.score = game.data.score;
            return true;
        }
        return false;
    },

    /**
     * draw the score
     */
    draw: function (renderer) {
        this.texttorender = "SCORE:" + game.data.score;
        this.font.draw(renderer,this.texttorender, this.pos.x, this.pos.y);
    }
});

/**
* a basic HUD item to display player helth
 */
game.HUD.HelthItem = me.Renderable.extend({
    /**
     * constructor
     */
    init : function (x, y) {
        // call the parent constructor
        // (size does not matter here)
        this._super(me.Renderable, 'init', [x, y, 100, 10]);

        // create a font
        this.font = new me.BitmapFont("32x32_font", 32);
        this.font.set("left");



        // local copy of the global helth
        this.health = -1;
    },

    /**
     * update function
     */
    update : function (dt) {
        // we don't do anything fancy here, so just
        // return true if the score has been updated
        if (this.health !== game.data.Playerhealth) {
            this.health = game.data.Playerhealth;
            return true;
        }
        return false;
    },

    /**
     * draw the score
     */
    draw: function (renderer) {
        this.texttorender = "HEALTH:" + game.data.Playerhealth;
        this.font.draw(renderer, this.texttorender, this.pos.x, this.pos.y);
    }
});
