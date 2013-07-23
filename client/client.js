var extend = function(recipient, sender) {
  for (var i in sender) {
    recipient[i] = sender[i];
  }
};

var onKeyChange = function(fn) {
	window.addEventListener('keydown', function(e) {
    fn(e.keyCode, true);
  });

  window.addEventListener('keyup', function(e) {
    fn(e.keyCode, false);
  });
};

var StateListener = function(socket, data) {
  var ignore = false;

  socket.on('update', function(message) {
    if (Math.random() < 0.01) {
      ignore = true;
      setTimeout(function() {
        ignore = false;
      }, 200);
    }

    if (ignore === false) {
      data[message.id] = data[message.id] || {};
      extend(data[message.id], message.data);
    }
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

window.onload = function() {
  var socket = io.connect('http://localhost:5000');
  socket.on('setup', function(data) {
    var players = {};
    players[data.player.id] = new Player(data.player.id, data.player.position);

    var stateListener = new StateListener(socket, players);

    onKeyChange(function(key, down) {
      socket.emit('keypress', { key:key, down:down });
    });

    var ctx = setupCtx(data.game.w, data.game.h);

    var render = function() {
      var data = stateListener.getData();
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (var i in data) {
        drawPlayer(ctx, data[i]);
      };

      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
  });
};
