var extend = function(sender, recipient) {
  for (var i in sender) {
    recipient[i] = sender[i];
  }
};

var ActiveKeyDispatcher = function() {
  var keyStates = {};
  var fns = [];
	window.addEventListener('keydown', function(e) {
    keyStates[e.keyCode] = true;
  });

  window.addEventListener('keyup', function(e) {
    keyStates[e.keyCode] = false;
  });

  setInterval(function() {
    for (var i in keyStates) {
      if (keyStates[i] === true) {
        var keyCode = parseInt(i, 10);
        fns.forEach(function(x) {
          x(keyCode);
        });
      }
    }
  }, 10);

  this.register = function(fn) {
    fns.push(fn);
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

  socket.on('death', function(message) {
    delete data[message.id];
  });

  this.getData = function() {
    return data;
  };

  this.setDatum = function(id, value) {
    data[id] = value;
  };
};

var drawPlayer = function(ctx, player) {
  var ship = {
    w: 20,
    h: 20,
  };

  ctx.save();
  ctx.translate(player.position.x + ship.w / 2,
                player.position.y + ship.h / 2);
  ctx.rotate(player.angle); // radians
  ctx.fillStyle = player.color || "#fff";
  ctx.fillRect(-(ship.w / 2), -(ship.h / 2), ship.w, ship.h);
  ctx.fillStyle = "#f00";
  ctx.fillRect(-(ship.w / 2), -(ship.h / 2), ship.w, ship.h / 10);

  ctx.restore();
};

var drawPlayers = function(ctx, players) {
  for (var i in players) {
    drawPlayer(ctx, players[i]);
  }
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
    var activeKeyDispatcher = new ActiveKeyDispatcher();

    var player = new Player(data.player);
    player.color = "yellow";
    stateListener.setDatum(data.player.id, player);
    activeKeyDispatcher.register(player.change.bind(player));

    activeKeyDispatcher.register(function(key) {
      latentBy(1000, function() {
        socket.emit('keyactive', { key:key });
      });
    });

    var ctx = setupCtx(data.game.w, data.game.h);

    requestAnimationFrameLoop(function() {
      var data = stateListener.getData();
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawPlayers(ctx, data);
    });

    var delta = new Date().getTime();
    requestAnimationFrameLoop(function() {
      var now = new Date().getTime();
      player.update(now - delta);
      delta = now;
    });
  });
};
