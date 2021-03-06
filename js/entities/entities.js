/**
 * Player Entity
 */
game.PlayerEntity = me.Entity.extend({
    /**
     * constructor
     */
    init: function (x, y, settings) {
        // call the constructor
        this._super(me.Entity, 'init', [x, y, settings]);

        this.body.collisionType = me.collision.types.PLAYER_OBJECT;

        // set the default horizontal & vertical speed (accel vector)
        this.body.setVelocity(3, 15);
        

        // set the display to follow our position on both axis
        me.game.viewport.follow(this.pos, me.game.viewport.AXIS.BOTH);
        me.game.viewport.setDeadzone(50, 150);

        // ensure the player is updated even when outside of the viewport
        this.alwaysUpdate = true;

        // define a basic walking animation (using all frames)
        this.renderable.addAnimation("walk", [0, 1, 2, 3, 4, 5, 6, 7]);
        // define a standing animation (using the first frame)
        this.renderable.addAnimation("stand", [0]);
        // set the standing animation as default
        this.renderable.setCurrentAnimation("stand");
    },

    /**
     * update the entity
     */
    update: function (dt) {

        if (me.input.isKeyPressed('left')) {
            // flip the sprite on horizontal axis
            this.renderable.flipX(true);
            game.Laser.flipX = true;
            // update the entity velocity
            this.body.vel.x -= this.body.accel.x * me.timer.tick;
            // change to the walking animation
            if (!this.renderable.isCurrentAnimation("walk")) {
                this.renderable.setCurrentAnimation("walk");
            }
        }
        else if (me.input.isKeyPressed('right')) {
            // unflip the sprite
            this.renderable.flipX(false);
            game.Laser.flipX = false;
            // update the entity velocity
            this.body.vel.x += this.body.accel.x * me.timer.tick;
            // change to the walking animation
            if (!this.renderable.isCurrentAnimation("walk")) {
                this.renderable.setCurrentAnimation("walk");
            }
        }
        else {
            this.body.vel.x = 0;
            // change to the standing animation
            this.renderable.setCurrentAnimation("stand");
        }
        if (me.input.isKeyPressed('jump')) {
            this.body.maxVel.y = game.data.Playerjumppower;
            if (!this.body.jumping && !this.body.falling) {
                // set current vel to the maximum defined value
                // gravity will then do the rest
                this.body.vel.y = -this.body.maxVel.y * me.timer.tick;
                // set the jumping flag
                this.body.jumping = true;

                // play some audio
                me.audio.play("jump");
            }
        }


        if (game.data.Usegun == true) {
            if (me.input.isKeyPressed('fire')) {
                // when we need to manually create a new bullet:
               objlaser = new game.Laser(this.pos.x + game.Laser.width, this.pos.y + this.body.height / 2);
               me.game.world.addChild(objlaser);
               me.audio.play("laser");

            }
        }

        // apply physics to the body (this moves the entity)
        this.body.update(dt);



        // handle collisions against other shapes
        me.collision.check(this);

        // return true if we moved or if the renderable was updated
        return (this._super(me.Entity, 'update', [dt]) || this.body.vel.x !== 0 || this.body.vel.y !== 0);
    },

    /**
     * colision handler
     */
    onCollision: function (response, other) {
        switch (response.b.body.collisionType) {
            case me.collision.types.WORLD_SHAPE:
                // Simulate a platform object
                if (other.type === "platform") {
                    if (this.body.falling &&
                        !me.input.isKeyPressed('down') &&
                        // Shortest overlap would move the player upward
                        (response.overlapV.y > 0) &&
                        // The velocity is reasonably fast enough to have penetrated to the overlap depth
                        (~~this.body.vel.y >= ~~response.overlapV.y)
                    ) {
                        // Disable collision on the x axis
                        response.overlapV.x = 0;
                        // Repond to the platform (it is solid)
                        return true;
                    }
                    // Do not respond to the platform (pass through)
                    return false;
                }

                if (other.type === "past") {
                    // remove it
                    me.game.world.removeChild(this);
                    game.levelrest();
                }
                break;

            case me.collision.types.ENEMY_OBJECT:
                if ((response.overlapV.y > 0) && !this.body.jumping) {
                    // bounce (force jump)

                    if (other.name == "EnemyFly") {
                        // give some score
                        game.data.score += 1000;
                        // make sure it cannot be collected "again"
                        this.collidable = false;
                        // remove it
                        me.game.world.removeChild(other);
                    }

                    if (other.name == "EnemyFrog") {
                        // give some score
                        game.data.score += 1200;
                        // make sure it cannot be collected "again"
                        this.collidable = false;
                        // remove it
                        me.game.world.removeChild(other);
                    }

                    this.body.falling = false;
                    this.body.vel.y = -this.body.maxVel.y * me.timer.tick;
                    // set the jumping flag
                    this.body.jumping = true;

                    // play some audio
                    me.audio.play("stomp");
                }
                else {
                    // let's flicker in case we touched an enemy
                    // this.renderable.flicker(750);
                }
                return false;
                break;

            default:
                // Do not respond to other objects (e.g. coins)
                return false;
        }

        // Make the object solid
        return true;
    }
});


/**
 * Coin Entity
 */
game.CoinEntity = me.CollectableEntity.extend({
    init: function (x, y, settings) {
        // call the parent constructor
        this._super(me.CollectableEntity, 'init', [x, y, settings]);
    },

    /**
     * colision handler
     */
    onCollision: function (response, other) {

        if (other.name == "mainPlayer") {
            // play a "coin collected" sound
            me.audio.play("cling");


            // give some score
            game.data.score += 250;

            //avoid further collision and delete it
            this.body.setCollisionMask(me.collision.types.NO_OBJECT);

            me.game.world.removeChild(this);
        }

        return false;
    }
});

/**
 * Enemy EnemyFrog
 */
game.EnemyFrog = me.Entity.extend(
{
    init: function (x, y, settings) {
        // define this here instead of tiled
        settings.image = "frog";

        // save the area size defined in Tiled
        var width = settings.width;
        var height = settings.height;

        // adjust the size setting information to match the sprite size
        // so that the entity object is created with the right size
        settings.framewidth = settings.width = 55;
        settings.frameheight = settings.height = 50;

        // redefine the default shape (used to define path) with a shape matching the renderable
        settings.shapes[0] = new me.Rect(0, 0, settings.framewidth, settings.frameheight);

        // call the parent constructor
        this._super(me.Entity, 'init', [x, y, settings]);

        // set start/end position based on the initial area size
        x = this.pos.x;
        this.startX = x;
        this.endX = x + width - settings.framewidth;
        this.pos.x = x + width - settings.framewidth;

        // to remember which side we were walking
        this.walkLeft = false;

        // walking & jumping speed
        this.body.setVelocity(1, 6);
    },

    // manage the enemy movement
    update: function (dt) {
        if (this.alive) {
            if (this.walkLeft && this.pos.x <= this.startX) {
                this.walkLeft = false;
            }
            else if (!this.walkLeft && this.pos.x >= this.endX) {
                this.walkLeft = true;
            }

            this.renderable.flipX(this.walkLeft);
            this.body.vel.x += (this.walkLeft) ? -this.body.accel.x * me.timer.tick : this.body.accel.x * me.timer.tick;

        }
        else {
            this.body.vel.x = 0;
        }
        // check & update movement
        this.body.update(dt);

        // handle collisions against other shapes
        me.collision.check(this);

        // return true if we moved or if the renderable was updated
        return (this._super(me.Entity, 'update', [dt]) || this.body.vel.x !== 0 || this.body.vel.y !== 0);
    },

    /**
     * colision handler
     * (called when colliding with other objects)
     */
    onCollision: function (response, other) {

        if (response.b.body.collisionType !== me.collision.types.WORLD_SHAPE) {
            // res.y >0 means touched by something on the bottom
            // which mean at top position for this one
            if (this.alive && (response.overlapV.x > 0) && response.a.body.falling) {
                if (response.a.name == "mainPlayer") {
                    response.a.renderable.flicker(750);
                //player dieing
                    if (game.data.Playerhealth >= 5) {
                        game.data.Playerhealth -= 5;
                        return false;
                    } else {
                        //player die
                        // remove it
                        me.game.world.removeChild(other);
                        game.levelrest()
                    }
                }
            }
            return false;
        }
        // Make all other objects solid
        return true;
    }
});

/**
 * Enemy Fly
 */
game.EnemyFly = me.Entity.extend(
{
    init: function (x, y, settings) {
        // define this here instead of tiled
        settings.image = "fly";

        // save the area size defined in Tiled
        var width = settings.width;
        var height = settings.height;

        // adjust the size setting information to match the sprite size
        // so that the entity object is created with the right size
        settings.framewidth = settings.width = 58;
        settings.frameheight = settings.height = 40;

        // redefine the default shape (used to define path) with a shape matching the renderable
        settings.shapes[0] = new me.Rect(0, 0, settings.framewidth, settings.frameheight);

        // call the parent constructor
        this._super(me.Entity, 'init', [x, y, settings]);

        // set start/end position based on the initial area size
        x = this.pos.x;
        this.startX = x;
        this.endX = x + width - settings.framewidth;
        this.pos.x = x + width - settings.framewidth;

        // to remember which side we were walking
        this.walkLeft = false;

        // walking & jumping speed
        this.body.setVelocity(2, 0);
    },

    // manage the enemy movement
    update: function (dt) {
        if (this.alive) {
            if (this.walkLeft && this.pos.x <= this.startX) {
                this.walkLeft = false;
            }
            else if (!this.walkLeft && this.pos.x >= this.endX) {
                this.walkLeft = true;
            }

            this.renderable.flipX(this.walkLeft);
            this.body.vel.x += (this.walkLeft) ? -this.body.accel.x * me.timer.tick : this.body.accel.x * me.timer.tick;

        }
        else {
            this.body.vel.x = 0;
        }
        // check & update movement
        this.body.update(dt);

        // handle collisions against other shapes
        me.collision.check(this);

        // return true if we moved or if the renderable was updated
        return (this._super(me.Entity, 'update', [dt]) || this.body.vel.x !== 0 || this.body.vel.y !== 0);
    },

    /**
     * colision handler
     * (called when colliding with other objects)
     */
    onCollision: function (response, other) {
        if (response.b.body.collisionType !== me.collision.types.WORLD_SHAPE) {
            // res.y >0 means touched by something on the bottom
            // which mean at top position for this one
            if (this.alive && (response.overlapV.y > 0) && response.a.body.falling) {
                console.log(other);
                if (response.a.name == "mainPlayer") {
                response.a.renderable.flicker(750);
                //player dieing
                    if (game.data.Playerhealth >= 5) {
                        game.data.Playerhealth -= 5;
                    } else {
                        //player die
                        game.data.Playerhealth = 0;
                        // remove it
                        me.game.world.removeChild(other);
                        console.log(other.name);
                        game.levelrest()
                    }
                }
            }
            return false;
        }
        // Make all other objects solid
        return true;
    }
});


/**
 * Gun Entity
 */
game.GunEntity = me.CollectableEntity.extend({
    init: function (x, y, settings) {
        // call the parent constructor
        this._super(me.CollectableEntity, 'init', [x, y, settings]);
    },

    /**
     * colision handler
     */
    onCollision: function (response, other) {

        // play a "coin collected" sound
        me.audio.play("cling");

        game.data.Usegun = true;

        //avoid further collision and delete it
        this.body.setCollisionMask(me.collision.types.NO_OBJECT);

        me.game.world.removeChild(this);

        return false;
    }
});

/**
 * Laser for player gun
 */

game.Laser = me.Entity.extend({
    init : function (x, y) {
        this._super(me.Entity, "init", [x, y, { width: game.Laser.width, height: game.Laser.height}]);
        this.z = 5;
        this.shotpos = x;
        this.flipX = game.Laser.flipX;
        this.body.setVelocity(150, 0);

        this.body.collisionType = me.collision.types.PROJECTILE_OBJECT;
        this.body.setCollisionMask(me.collision.types.ENEMY_OBJECT);
        this.renderable = new (me.Renderable.extend({

            init : function () {
                this._super(me.Renderable, "init", [0, 0, game.Laser.width, game.Laser.height]);
            },
            destroy: function () { },
            draw: function (renderer) {
                var color = renderer.globalColor.toHex();
                renderer.setColor('#6e6e86');
                renderer.fillRect(0, 0, this.width, this.height);
                renderer.setColor(color);
            },

        }));
        this.alwaysUpdate = true;
    },

    update : function (time) {
        if (this.flipX == false) {
            this.body.vel.x += this.body.accel.x * time / 1000;
            if (this.pos.x + this.width >= this.shotpos + game.Laser.dostrel) {
                this.renderable = null;
                me.game.world.removeChild(this);
            }
        }

        if (this.flipX == true) {
            this.body.vel.x -= this.body.accel.x * time / 1000;
            if (this.pos.x - this.width <= this.shotpos - game.Laser.dostrel) {
                this.renderable = null;
                me.game.world.removeChild(this);
            }
        }

        this.body.update();
        me.collision.check(this);

        return true;
    },

    onCollision: function (response, other) {
        if (response.b.body.collisionType == me.collision.types.ENEMY_OBJECT) {
            response.b.renderable.flicker(1000);
            response.b.body.collisionType = me.collision.types.NO_OBJECT;
            this.renderable = null;
            me.game.world.removeChild(this);
        }

        return false;
    }
});

game.Laser.width = 28;
game.Laser.height = 5;
game.Laser.dostrel = 800;



/**
 * Gun Entity
 */
game.NextLevel = me.LevelEntity.extend({

    init: function (x,y,settings){
        //call the debugger here and check that settings has the things that you want or...
        var someSetting = settings.customSetting
        this._super(me.LevelEntity, 'init', [x,y,settings]);
        this.customSetting = someSetting;
        this.body.setCollisionMask(me.collision.types.PLAYER_OBJECT);
    },

});
