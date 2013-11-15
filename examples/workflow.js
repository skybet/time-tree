
// This example requires you to install async

var async = require('async');
var timetree = require('../');
var util = require('util');

function somethingSynchronous() {
    var i = 100000, numbers = [];
    while (i--) {
        numbers.push(i);
    }
    return numbers.reduce(function(a,b) { return a * b; })
}
function databaseLookup(id, callback) {
    setTimeout(function() {
        callback(null, {
            id: id,
            data: 'Some Data about ' + id
        });
    }, 30 + Math.random() * 50)
}

var timer = timetree('example');

return async.waterfall(
    [
        function(callback) {
            var subTimer = timer.split('task1');
            return setTimeout(subTimer.done(callback), 40);
        },
        function(callback) {
            var subTimer = timer.split('task2');
            somethingSynchronous();
            subTimer.end();
            return callback();
        },
        function(callback) {
            var subTimer = timer.split('task3', { actions: 3 });
            return async.map(
                [1, 2, 3],
                function(item, next) {
                    var itemTimer = subTimer.split('item' + item);
                    databaseLookup(item, itemTimer.done(next));
                },
                function(err, results) {
                    subTimer.end();
                    var data = results.map(function(a) { return a.data; });
                    return callback(err, data);
                }
            );
        }
    ],
    function(err, data) {
        timer.end();
        console.log(util.inspect(timer.getResult(), false, 4));
    }
);
