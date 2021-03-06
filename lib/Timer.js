
/**
 * Constructor.
 *
 * @param {String} name Name of the timer.
 * @param {object} context Context metadata (optional)
 */
function Timer(name, context) {

    // Init data
    this.data = {
        name: name,
        duration: null
    };

    if (context) {
        this.data.context = context;
    }

    // Start timer
    this.startTime = this.USE_HRTIME ? process.hrtime() : Date.now();
}

// ----------

/**
 * Determine whether to use process.hrtime() or Date.now().
 */
Timer.prototype.USE_HRTIME = "hrtime" in process;

// ----------

/**
 * Gets the timer name.
 *
 * @return {string}
 */
Timer.prototype.getName = function() {
    return this.data.name;
}

/**
 * Gets the timer duration.
 *
 * @return {float}
 */
Timer.prototype.getDuration = function() {
    return this.data.duration;
}

/**
 * Gets the context metadata for the timer.
 *
 * @return {object}
 */
Timer.prototype.getContext = function() {
    return this.data.context;
}

/**
 * Sets the context metadata for the timer.
 *
 * @param {object} context For example, the number of actions being performed.
 *
 * @return {Timer}
 */
Timer.prototype.setContext = function(context) {
    this.data.context = context;
    return this;
}

// ----------

/**
 * Creates and returns a new sub timer.
 *
 * @param {String} name Name of the timer.
 * @param {object} context Context metadata (optional)
 *
 * @return {Timer}
 */
Timer.prototype.split = function(name, context) {
    var timer = new Timer(name, context);
    this.data.timers = this.data.timers || [];
    this.data.timers.push(timer);
    return timer;
}

/**
 * Ends the time, calculating the duration.
 *
 * @return {Timer}
 */
Timer.prototype.end = function() {
    if(this.data.duration === null) {
        if(this.USE_HRTIME) {
            var result = process.hrtime(this.startTime);
            this.data.duration = (result[0] * 1000) + (result[1] / 1000000);
        } else {
            this.data.duration = Date.now() - this.startTime;
        }
    }
    return this;
}

/**
 * Wraps a callback to include a call to end().
 *
 * @param {function} callback Function to wrap
 *
 * @return {function} Wrapped callback
 */
Timer.prototype.wrap = function(callback) {
    var timer = this;
    return function() {
        timer.end();
        return callback.apply(this, arguments);
    };
}

// ----------

/**
 * Returns the first sub timer object that matches the given name.
 *
 * @param {string} name Name of timer to search for
 * @param {Boolean} recursive Whether to search recursively. Optional. Defaults to FALSE.
 *
 * @return {Timer}
 */
Timer.prototype.getSubTimer = function(name, recursive) {
    var matches = this.getSubTimers(name, recursive);
    return matches.length > 0 ? matches[0] : null;
}

/**
 * Returns the sub timer objects that match the given name.
 *
 * @param {string} name Name of timer to search for
 * @param {Boolean} recursive Whether to search recursively. Optional. Defaults to FALSE.
 *
 * @return {Timer[]}
 */
Timer.prototype.getSubTimers = function(name, recursive) {
    var matches = [];
    if(this.data.timers) {
        var subTimer, match;
        for(var i in this.data.timers) {
            subTimer = this.data.timers[i];
            if(subTimer.getName() == name) {
                matches.push(subTimer);
            }
            if(recursive) {
                matches.push.apply(matches, subTimer.getSubTimers(name, recursive));
            }
        }
    }
    return matches;
}

/**
 * Reduces the timer and it's sub-timers to plain objects, i.e. for logging.
 *
 * Times are in milliseconds.
 *
 * @return {object}
 */
Timer.prototype.getResult = function() {
    var result = {
        name: this.data.name,
        duration: this.data.duration
    };
    if(this.data.context) {
        result.context = this.data.context
    }
    if(this.data.timers) {
        result.timers = this.data.timers.map(function(timer) {
            return timer.getResult();
        });
    }
    return result;
}

// ----------

module.exports = Timer;
