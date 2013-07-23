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
  socket.emit('ack', socket.id);
  players[socket.id] = new Player(socket.id);
  io.sockets.emit('update', players[socket.id].toData());

  socket.on('keypress', function(data) {
    players[socket.id].change(data);
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
  for (var i in players) {
    players[i].update(new Date().getTime() - last);
  }
  last = new Date().getTime();
}, 17);
