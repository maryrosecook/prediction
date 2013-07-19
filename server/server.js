var app = require('http').createServer(handler),
    io = require('socket.io').listen(app, { log: false }),
    fs = require('fs');

app.listen(5000);

function handler (req, res) {
  var file = req.url === "/" ? "/client/index.html" : req.url;
  fs.readFile(__dirname + "/.." + file, function (err, data) {
    if (err) {
      console.log(err)
      res.writeHead(404);
      res.end();
    } else {
      res.writeHead(200);
      res.end(data);
    }
  });
}

var players = {};

var Player = function(id) {
  this.id = id;
  this.angle = 0;
  this.position = { x: 50, y:50 };
  this.vector = { x:0, y:0 };
  this.state = [];
};

var ROTATION_FACTOR = 0.005;
var THRUST_FACTOR = 0.001;

Player.prototype = {
  update: function(delta) {
    if (this.state[37]) { // left
      this.angle -= ROTATION_FACTOR * delta;
    } else if (this.state[39]) { // right
      this.angle += ROTATION_FACTOR * delta;
    } else if (this.state[38]) { // up
      this.vector.x -= Math.sin(this.angle) * THRUST_FACTOR * delta;
      this.vector.y += Math.cos(this.angle) * THRUST_FACTOR * delta;
    }

    this.position.x += this.vector.x;
    this.position.y += this.vector.y;
  },

  change: function(data) {
    this.state[data.key] = data.down;
  },

  toData: function() {
    return {
      id: this.id,
      data: {
        angle: this.angle,
        position: this.position
      }
    };
  }
};

io.sockets.on('connection', function (socket) {
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
