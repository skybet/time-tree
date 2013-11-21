# time-tree

Timer utility for Node.js that gives you a contextual tree of where time is spent.

If `process.hrtime()` is available, it will use it, otherwise it will use `Date.now()`.

[![Build Status](https://travis-ci.org/skybet/time-tree.png)](https://travis-ci.org/skybet/time-tree)
[![NPM version](https://badge.fury.io/js/time-tree.png)](http://badge.fury.io/js/time-tree)

## Install

To install the most recent release from npm, run:

    npm install time-tree

## Quick Example

```javascript
var timetree = require('time-tree');

var timer = timetree('example');
timer.setContext({ actions: 2 });
return doSomething(timer, function() {
    return doSomething(timer, function() {
        timer.end();
        console.log(timer.getResult());
    });
});

function doSomething(timer, callback) {
    var subTimer = timer.split('subtask');
    setTimeout(function() {
        subTimer.end();
        return callback();
    }, 100);
}
```

Outputs,

```javascript
{ name: 'example',
  duration: 205.275,
  context: { actions: 2 },
  timers:
   [ { name: 'subtask', duration: 103.307 },
     { name: 'subtask', duration: 101.597 } ] }
```

See `examples/` for more.

## Documentation

* [Constructor](#constructor)
* [setContext](#setContext)
* [split](#split)
* [end](#end)
* [wrap](#wrap)
* [getResult](#getResult)

<a name="constructor" />
### timetree(name[, context])

Creates a new Timer object with the given name, and **starts the timer**.

**Arguments**

* name - Name of the timer.
* context - Optional, see [setContext()](#setContext).

**Example**

```javascript
var timetree = require('time-tree');
var timer = timetree('myTimer');
```

<a name="setContext" />
### setContext(context)

Sets context data for the timer. This is returned with the timer data in [getResult()](#getResult).

For example, if you're timing how long it takes to perform N actions, you may want to set N to the context.

**Arguments**

* context - Context data to set on the timer.

**Example**

```javascript
timer.setContext({ actions: 2 });
```

<a name="split" />
### split(name[, context])

Creates a new sub timer with the given name, **starts the sub timer**, stores it in the parent timer, and returns it.

**Arguments**

* name - Name of the sub timer.
* context - Optional context metadta for the sub timer, see [setContext()](#setContext).

**Example**

```javascript
var subTimer = timer.split('subTimer');
```

<a name="end" />
### end()

Stops the timer, calculating the duration of the timer.

**Note:** You must stop each individual timer. Calling `end()` on a parent timer will **not** call `end()` on its sub timers.

**Example**

```javascript
timer.end();
```

<a name="wrap" />
### wrap()

Wraps a callback to include a call to [end()](#end).

**Arguments**

* callback - Function to wrap

**Example**

```javascript
// Instead of this
fs.readFile(filename, function (err, file) {
  timer.end();
  callback(err, file);
})

// You can do this
fs.readFile(filename, timer.wrap(callback));
```

<a name="getResult" />
### getResult()

Returns the timer and all sub timers as a plain data object, i.e. for logging.

**Example**

```javascript
timer.getResult();
```

Returns,

```javascript
{ name: 'myTimer',
  duration: 100,
  context: { actions: 2 },
  timers:
   [ { name: 'subTimer', duration: 50 } ] }
```