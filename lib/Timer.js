
/**
 * Constructor.
 *
 * @param {String} name Name of the timer.
 * @param {object} context extra metadata (optional)
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
 * Sets context data for the timer.
 *
 * @param {object} context For example, the number of actions being performed.
 *
 * @return {Timer}
 */
Timer.prototype.setContext = function(context) {
    this.data.context = context;
    return this;
}

/**
 * Creates and returns a new sub timer.
 *
 * @param {String} name Name of the timer.
 *
 * @return {Timer}
 */
Timer.prototype.split = function(name) {
    var timer = new Timer(name);
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

// ----------

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
