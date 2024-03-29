var extend = function(sender, recipient) {
  for (var i in sender) {
    recipient[i] = sender[i];
  }
};

var sync = function(entity, update) {
  if (entity.changes === undefined) {
    extend(update.data, entity);
    return;
  }

  var eventsToReplay = entity.changes.filter(function(x) {
    return x.syn > update.syn;
  });

  extend(update.data, entity);

  eventsToReplay.forEach(function(x) {
    entity.change(x);
  });

  entity.changes = eventsToReplay;
};

var drawCircle = function(ctx, radius, position, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(position.x, position.y, radius, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fill();
}

var KeyDispatcher = function() {
  var keyStates = {};
  var fns = { active: [], up: [], down: [] };
  var syn = 0;

  var dispatch = function(dispatchFns, keyCodeStr) {
    var keyCode = parseInt(keyCodeStr, 10);
    dispatchFns.forEach(function(f) {
      f({ syn: syn++, keyCode: keyCode });
    });
  };

  window.addEventListener('keydown', function(e) {
    keyStates[e.keyCode] = true;
    dispatch(fns.down, e.keyCode);
  });

  window.addEventListener('keyup', function(e) {
    keyStates[e.keyCode] = false;
    dispatch(fns.up, e.keyCode);
  });

  setInterval(function() {
    for (var i in keyStates) {
      if (keyStates[i] === true) {
        dispatch(fns.active, i);
      }
    }
  }, 10);

  this.register = function(eventType, fn) {
    fns[eventType].push(fn);
  };
};

var constructEntity = function(message) {
  var Ctor = eval(message.ctor);
  return new Ctor(message.data);
};

var StateListener = function(socket) {
  this.data = {};
  var self = this;

  socket.on('update', function(message) {
    self.data[message.id] = self.data[message.id] || constructEntity(message);

    sync(self.data[message.id], message);
  });

  socket.on('destroy', function(message) {
    delete self.data[message.id];
  });
};

Player.prototype.draw = function(ctx) {
  drawCircle(ctx, 10, this.position, this.color || "#fff");
  ctx.save();
  ctx.translate(this.position.x, this.position.y);
  ctx.rotate(this.angle); // radians
  drawCircle(ctx, 2, { x: 0, y: this.size.y / 3 }, "#f00")
  ctx.restore();
};

Player.prototype.logAndChange = function(e) {
  this.changes = this.changes || [];
  this.changes.push(e);
  this.change(e);
};

Bullet.prototype.draw = function(ctx) {
  drawCircle(ctx, this.size.x / 2, this.position, "#fff");
};

Player.prototype.fire = function() {
  return new Bullet({
    position: {
      x: this.position.x - Math.sin(this.angle) * this.size.x / 2,
      y: this.position.y + Math.cos(this.angle) * this.size.y / 2
    },
    angle: this.angle,
    shooterId: this.id
  });
};

var setupCtx = function(w, h) {
  var canvas = document.getElementById("canvas");
  canvas.width = w;
  canvas.height = h;
  return canvas.getContext('2d');
};

var requestAnimationFrameLoop = function(fn) {
  requestAnimationFrame(function recur() {
    fn();
    requestAnimationFrame(recur);
  });
};

window.onload = function() {
  var socket = io.connect('http://localhost:5000');
  socket.on('setup', function(data) {
    var stateListener = new StateListener(socket);
    var keyDispatcher = new KeyDispatcher();

    var player = new Player(data.player);
    player.color = "yellow";
    stateListener.data[data.player.id] = player;
    keyDispatcher.register('active', player.logAndChange.bind(player));
    keyDispatcher.register('down', function(keyCode) {
      if (keyCode === 32) {
        var bullet = player.fire();
        stateListener.data[bullet.id] = bullet;
        latentBy(0, function() {
          socket.emit('newbullet', bullet);
        });
      }
    });

    keyDispatcher.register('active', function(e) {
      latentBy(500, function() {
        socket.emit('keyactive', e);
      });
    });

    var ctx = setupCtx(data.game.size.x, data.game.size.y);

    requestAnimationFrameLoop(function() {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (var i in stateListener.data) {
        stateListener.data[i].draw(ctx);
      };
    });

    var delta = new Date().getTime();
    requestAnimationFrameLoop(function() {
      var now = new Date().getTime();
      for (var i in stateListener.data) {
        stateListener.data[i].update(now - delta);
      };

      forEveryCollidingPair(entities, function(a, b) {
        delete stateListener.data[a.id];
        delete stateListener.data[b.id];
      });

      delta = now;
    });
  });
};
