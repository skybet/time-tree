
var Timer = require('./lib/Timer');

module.exports = function(name) {
    return new Timer(name);
}

module.exports.Timer = Timer;