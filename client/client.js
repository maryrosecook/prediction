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

var StateListener = function(socket, data) {

  socket.on('update', function(message) {
  });

  socket.on('death', function(message) {
    delete data[message.id];
  });

  this.getData = function() {
    return data;
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
  ctx.fillStyle = "#fff";
  ctx.fillRect(-(ship.w / 2), -(ship.h / 2), ship.w, ship.h);
  ctx.fillStyle = "#f00";
  ctx.fillRect(-(ship.w / 2), -(ship.h / 2), ship.w, ship.h / 10);

  ctx.restore();
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
    var players = {};
    var player = new Player(data.player.id, data.player.position);
    players[data.player.id] = player;

    var stateListener = new StateListener(socket, players);
    var activeKeyDispatcher = new ActiveKeyDispatcher();

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

      for (var i in data) {
        drawPlayer(ctx, data[i]);
      };
    });

    var delta = new Date().getTime();
    requestAnimationFrameLoop(function() {
      var now = new Date().getTime();
      player.update(now - delta);
      delta = now;
    });
  });
};
