;(function(exports) {
  var Player = function(settings) {
    this.id = settings.id;
    this.angle = settings.angle || 0;
    this.position = settings.position;
    this.size = { x:20, y:20 };
    this.vector = { x:0, y:0 };
  };

  var ROTATION_FACTOR = 0.05;
  var THRUST_FACTOR = 0.001;

  Player.prototype = {
    update: function(delta) {
      this.position.x += this.vector.x * delta;
      this.position.y += this.vector.y * delta;
    },

    change: function(keyCode) {
      if (keyCode === 37) { // left
        this.angle -= ROTATION_FACTOR;
      } else if (keyCode === 39) { // right
        this.angle += ROTATION_FACTOR;
      } else if (keyCode === 38) { // up
        this.vector.x -= Math.sin(this.angle) * THRUST_FACTOR;
        this.vector.y += Math.cos(this.angle) * THRUST_FACTOR;
      }
    }
  };

  exports.Player = Player;
}(typeof exports === 'undefined' ? this : exports));
