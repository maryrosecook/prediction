var app = require('http').createServer(handler);
var io = require('socket.io').listen(app, { log: false });
var fs = require('fs');
var Player = require('../shared/player').Player;
var Bullet = require('../shared/bullet').Bullet;
var collision = require('../shared/collision')

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

Player.prototype.logSynThenChange = function(e) {
  this.syn = e.syn; // last sync point
  this.change(e);
};

Player.prototype.toData = function() {
  return {
    ctor: 'Player',
    id: this.id,
    syn: this.syn,
    data: {
      angle: this.angle,
      position: this.position
    }
  };
};

Bullet.prototype.toData = function() {
  return {
    ctor: 'Bullet',
    id: this.id,
    shooterId: this.shooterId,
    data: {
      vector: this.vector,
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

  socket.on('keyactive', player.logSynThenChange.bind(player));

  socket.on('newbullet', function(data) {
    var bullet = new Bullet(data);
    entities[bullet.id] = bullet;
  });

  socket.on('disconnect', function() {
    delete entities[socket.id];
    io.sockets.emit('destroy', { id: socket.id });
  });
});

// send updates to clients
setInterval(function() {
  for (var i in entities) {
    io.sockets.emit('update', entities[i].toData());
  }
}, 17);

var values = function(o) {
  var a = [];
  for (var i in o) {
    a.push(o[i]);
  }
  return a;
}

// game tick
var last = new Date().getTime();
setInterval(function() {
  var now = new Date().getTime();
  for (var i in entities) {
    entities[i].update(now - last);
  }

  collision.forEveryCollidingPair(entities, function(a, b) {
    io.sockets.emit('destroy', { id: a.id });
    io.sockets.emit('destroy', { id: b.id });
    delete entities[a.id];
    delete entities[b.id];
  });

  last = now;
}, 17);
