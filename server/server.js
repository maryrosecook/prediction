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

var entities = {};
var gameSettings = {
  size: { x:300, y: 300 }
};

Player.prototype.toData = function() {
  return {
    ctor: 'Player',
    id: this.id,
    data: {
      angle: this.angle,
      position: this.position
    }
  };
};

io.sockets.on('connection', function (socket) {
  var player = new Player({
    id: socket.id,
    position: {
      x: Math.random() * gameSettings.size.x,
      y: Math.random() * gameSettings.size.y
    }
  });
  entities[socket.id] = player;

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
    delete entities[socket.id];
    io.sockets.emit('death', { id: socket.id });
  });
});

// send updates to clients
setInterval(function() {
  for (var i in entities) {
    io.sockets.emit('update', entities[i].toData());
  }
}, 17);


// game tick
var last = new Date().getTime();
setInterval(function() {
  var now = new Date().getTime();
  for (var i in entities) {
    entities[i].update(now - last);
  }
  last = now;
}, 17);
