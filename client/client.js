var extend = function(sender, recipient) {
  for (var i in sender) {
    recipient[i] = sender[i];
  }
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

  var dispatch = function(dispatchFns, keyCodeStr) {
    var keyCode = parseInt(keyCodeStr, 10);
    dispatchFns.forEach(function(f) {
      f(keyCode);
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
  var data = {};

  socket.on('update', function(message) {
    data[message.id] = data[message.id] || constructEntity(message);
    extend(message.data, data[message.id]);
  });

  socket.on('destroy', function(message) {
    delete data[message.id];
  });

  this.getData = function() {
    var outData = [];
    for (var i in data) {
      outData.push(data[i]);
    }
    return outData;
  };

  this.setDatum = function(id, value) {
    data[id] = value;
  };

  this.unsetDatum = function(id) {
    delete data[id];
  };
};

Player.prototype.draw = function(ctx) {
  drawCircle(ctx, 10, this.position, this.color || "#fff");
  ctx.save();
  ctx.translate(this.position.x, this.position.y);
  ctx.rotate(this.angle); // radians
  drawCircle(ctx, 2, { x: 0, y: this.size.y / 3 }, "#f00")
  ctx.restore();
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
    stateListener.setDatum(data.player.id, player);
    keyDispatcher.register('active', player.change.bind(player));
    keyDispatcher.register('down', function(keyCode) {
      if (keyCode === 32) {
        var bullet = player.fire();
        stateListener.setDatum(bullet.id, bullet);
        latentBy(0, function() {
          socket.emit('newbullet', bullet);
        });
      }
    });

    keyDispatcher.register('active', function(key) {
      latentBy(0, function() {
        socket.emit('keyactive', { key:key });
      });
    });

    var ctx = setupCtx(data.game.size.x, data.game.size.y);

    requestAnimationFrameLoop(function() {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      stateListener.getData().forEach(function(entity) {
        entity.draw(ctx);
      });
    });

    var delta = new Date().getTime();
    requestAnimationFrameLoop(function() {
      var now = new Date().getTime();
      var entities = stateListener.getData();
      entities.forEach(function(entity) {
        entity.update(now - delta);
      });

      forEveryCollidingPair(entities, function(a, b) {
        stateListener.unsetDatum(a.id);
        stateListener.unsetDatum(b.id);
      });

      delta = now;
    });
  });
};
