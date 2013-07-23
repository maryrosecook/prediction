;(function(exports) {
  var Player = function(id, position) {
    this.id = id;
    this.angle = 0;
    this.position = position;
    this.vector = { x:0, y:0 };
    this.keyState = [];
  };

  var ROTATION_FACTOR = 0.005;
  var THRUST_FACTOR = 0.001;

  Player.prototype = {
    update: function(delta) {
      if (this.keyState[37]) { // left
        this.angle -= ROTATION_FACTOR * delta;
      } else if (this.keyState[39]) { // right
        this.angle += ROTATION_FACTOR * delta;
      } else if (this.keyState[38]) { // up
        this.vector.x -= Math.sin(this.angle) * THRUST_FACTOR * delta;
        this.vector.y += Math.cos(this.angle) * THRUST_FACTOR * delta;
      }

      this.position.x += this.vector.x;
      this.position.y += this.vector.y;
    },

    change: function(keyCode, down) {
      this.keyState[keyCode] = down;
    }
  };

  exports.Player = Player;
}(typeof exports === 'undefined' ? this : exports));