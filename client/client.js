var startSendingKeypresses = function(socket) {
  var sendKeyPress = function(key, down) {
    socket.emit('keypress', { key:key, down:down });
  };

	window.addEventListener('keydown', function(e) {
    sendKeyPress(e.keyCode, true);
  });

	window.addEventListener('keyup', function(e) {
    sendKeyPress(e.keyCode, false);
  });
};

var StateListener = function(socket) {
  var data = {};
  var ignore = false;

  socket.on('update', function(message) {
    if (Math.random() < 0.01) {
      ignore = true;
      setTimeout(function() {
        ignore = false;
      }, 200);
    }

    if (ignore === false) {
      data[message.id] = message.data;
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

window.onload = function() {
  var socket = io.connect('http://localhost:5000');
  socket.on('ack', function(id) {
    var stateListener = new StateListener(socket);
    startSendingKeypresses(socket);

    var ctx = document.getElementById("canvas").getContext('2d');

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
