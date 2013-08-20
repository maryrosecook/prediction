;(function(exports) {
  // returns magnitude of passed vector
  var magnitude = function(vector) {
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  };

  // returns unit vector of passed vector
  var unitVector = function(vector) {
    return {
      x: vector.x / magnitude(vector),
      y: vector.y / magnitude(vector)
    };
  };

  var angleToVector = function(r) {
    if (r === undefined) throw "Angle for vector is undefined";
    var x = -Math.sin(r);
    var y = Math.cos(r);
    return unitVector({ x: x, y: y });
  };

  var guid = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  };

  var Bullet = function(settings) {
    this.id = settings.id || guid();
    this.position = settings.position;
    this.vector = angleToVector(settings.angle);
  };

  var THRUST_FACTOR = 0.2;

  Bullet.prototype = {
    update: function(delta) {
      this.position.x += this.vector.x * delta * THRUST_FACTOR;
      this.position.y += this.vector.y * delta * THRUST_FACTOR;
    }
  };

  exports.Bullet = Bullet;
}(typeof exports === 'undefined' ? this : exports));
