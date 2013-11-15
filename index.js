
var Timer = require('./lib/Timer');

module.exports = function(name, context) {
    return new Timer(name, context);
}

module.exports.Timer = Timer;