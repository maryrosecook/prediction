;(function(exports) {
  var Player, Bullet;
  if (typeof module !== 'undefined' && module.exports !== undefined) {
    Bullet = require('./bullet').Bullet;
    Player = require('./player').Player;
  } else {
    Player = window.Player;
    Bullet = window.Bullet;
  }

  var circlesColliding = function(a, b) {
    var distance = Math.sqrt(Math.pow(a.position.x - b.position.x, 2) +
                             Math.pow(a.position.y - b.position.y, 2));
    return distance < a.size.x / 2 + b.size.x / 2;
  };

  var values = function(o) {
    var a = [];
    for (var i in o) {
      a.push(o[i]);
    }
    return a;
  }

  var forEveryCollidingPair = function(entityObj, onCollision) {
    var entities = values(entityObj);
    for (var i = 0; i < entities.length; i++) {
      for (var j = i + 1; j < entities.length; j++) {
        var a = entities[i];
        var b = entities[j];
        if (circlesColliding(a, b) &&
            ((a instanceof Bullet && a.shooterId !== b.id) ||
             (b instanceof Bullet && b.shooterId !== a.id) ||
             (a instanceof Player && b instanceof Player))) {
          onCollision(a, b);
        }
      }
    }
  };

  exports.forEveryCollidingPair = forEveryCollidingPair;

}(typeof exports === 'undefined' ? this : exports));
