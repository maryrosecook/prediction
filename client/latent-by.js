;(function(exports) {
  var queue = [];
  var SEND_INTERVAL = 10;

  setTimeout(function recur() {
    var now = new Date().getTime();
    queue = queue.reduce(function(a, x) {
      if (now > x.time) {
        x.fn();
        return a;
      } else {
        return a.concat(x);
      }
    }, []);
    setTimeout(recur, SEND_INTERVAL);
  }, SEND_INTERVAL);

  exports.latentBy = function(timeout, fn) {
    queue.push({
      time: new Date().getTime() + timeout,
      fn: fn
    });
  };
}(this));
