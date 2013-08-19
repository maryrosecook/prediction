var app = require('http').createServer(handler),
    io = require('socket.io').listen(app, { log: false }),
    fs = require('fs'),
    Player = require('../shared/player').Player;

app.listen(5000);

function handler (req, res) {
  var file = req.url === "/" ? "/client/index.html" : req.url;
  fs.readFile(__dirname + "/.." + file, function (err, data) {
    if (err) {
      res.writeHead(404);
      res.end();
    } else {
      res.writeHead(200);
      res.end(data);
    }
  });
}

var players = {};
var gameSettings = {
  w: 300,
  h: 300
};

Player.prototype.toData = function() {
  return {
    id: this.id,
    data: {
      angle: this.angle,
      position: this.position
    }
  };
};

io.sockets.on('connection', function (socket) {
  var player = new Player(socket.id, {
    x: Math.random() * gameSettings.w,
    y: Math.random() * gameSettings.h
  });
  players[socket.id] = player;

  socket.emit('setup', {
    player: {
      id: player.id,
      position: player.position
    },
    game: gameSettings
  });

  io.sockets.emit('update', player.toData());

  socket.on('keyactive', function(data) {
    player.change(data.key);
  });

  socket.on('disconnect', function() {
    delete players[socket.id];
    io.sockets.emit('death', { id: socket.id });
  });
});

// send updates to clients
setInterval(function() {
  for (var i in players) {
    io.sockets.emit('update', players[i].toData());
  }
}, 17);


// game tick
var last = new Date().getTime();
setInterval(function() {
  var now = new Date().getTime();
  for (var i in players) {
    players[i].update(now - last);
  }
  last = now;
}, 17);
