
var async = require('async');
var timetree = require('../');
var util = require('util');

var timer = timetree('example');

return async.waterfall(
    [
        function(callback) {
            var subTimer = timer.split('task1');
            return setTimeout(function() {
                subTimer.end();
                return callback();
            }, 40);
        },
        function(callback) {
            var subTimer = timer.split('task2');
            return setTimeout(function() {
                subTimer.end();
                return callback();
            }, 40);
        },
        function(callback) {
            var subTimer = timer.split('task3');
            return async.each([1, 2, 3],
                function(item, callback) {
                    var itemTimer = subTimer.split('item' + item);
                    setTimeout(function() {
                        itemTimer.end();
                        return callback();
                    }, 10);
                },
                function() {
                    subTimer.end();
                    return callback();
                }
            );
        }
    ],
    function() {
        console.log(util.inspect(timer.getResult(), false, 4));
    }
);