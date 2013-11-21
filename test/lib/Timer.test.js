
// Dependencies
var assert = require('assert');
var Sinon = require('sinon');

// Lib
var DIR = process.cwd() + (process.env.MOCHA_COV ? '/lib-cov' : '/lib');
var Timer = require(DIR + '/Timer');

// ----------

describe('lib/Timer', function() {

    var HRTIME_AVAIL = 'hrtime' in process;

    var sinon, subject;

    beforeEach(function() {

        sinon = Sinon.sandbox.create({ useFakeTimers: false });

        sinon.stub(Date, 'now').returns(1000000000000);
        if(HRTIME_AVAIL) {
            sinon.stub(process, 'hrtime').returns([ 100000000, 0 ]);
        }

        subject = new Timer('event');
    });

    afterEach(function() {

        Timer.prototype.USE_HRTIME = HRTIME_AVAIL;

        sinon.restore();
    });

    // ----------

    describe('#constructor()', function() {

        it('should store name and start time using Date.now()', function() {

            Timer.prototype.USE_HRTIME = false;
            subject = new Timer('event');

            subject.data.name.should.equal('event');
            subject.startTime.should.equal(1000000000000);
        });

        if(HRTIME_AVAIL) {
            it('should store name and start time using process.hrtime()', function() {

                Timer.prototype.USE_HRTIME = true;
                subject = new Timer('event');

                subject.data.name.should.equal('event');
                subject.startTime.should.eql([ 100000000, 0 ]);
            });
        }

        it('should accept an initial context', function() {
            subject = new Timer('event', { query: 'SELECT 1' });

            subject.data.context.should.eql({query: 'SELECT 1'});
        })
    });

    // ----------

    describe('#getName()', function() {
        it('should return the timer name', function() {
            subject.getName().should.equal('event');
        });
    });

    describe('#getDuration()', function() {
        it('should return the deep nested result of the timer', function() {
            assert.equal(subject.getDuration(), null);
            subject.data.duration = 300;
            subject.getDuration().should.equal(300);
        });
    });

    // ----------

    describe('#(get|set)Context()', function() {
        it('should allow you to get and set context metadata', function() {

            assert.equal(subject.getContext(), null);

            var context = { foo: 1, bar: 2 };
            subject.setContext(context).should.equal(subject);
            subject.getContext().should.equal(context);
        });
    });

    // ----------

    describe('#split()', function() {
        it('should return a new timer and store it', function() {

            assert.equal(subject.data.timers, undefined);

            var subTimer1 = subject.split('subEvent');
            subTimer1.data.name.should.equal('subEvent');
            subTimer1.should.not.equal(subject);

            subject.data.timers.should.eql([ subTimer1 ]);

            var subTimer2 = subject.split('subEvent', { foo: 1 });
            subTimer2.data.name.should.equal('subEvent');
            subTimer2.data.context.should.eql({ foo: 1 });
            subTimer2.should.not.equal(subject);
            subTimer2.should.not.equal(subTimer1);

            subject.data.timers.should.eql([ subTimer1, subTimer2 ]);
        });
    });

    // ----------

    describe('#end()', function() {

        it('should store the timer duration using Date.now()', function() {

            Timer.prototype.USE_HRTIME = false;
            Date.now.reset();

            subject = new Timer('event');

            assert.equal(subject.data.duration, null);

            Date.now.returns(1000000000150);

            subject.end().should.equal(subject);
            subject.data.duration.should.equal(150);

            subject.end().should.equal(subject);

            Date.now.calledTwice.should.be.true;
        });

        if(HRTIME_AVAIL) {
            it('should store timer duration using process.hrtime()', function() {

                Timer.prototype.USE_HRTIME = true;
                process.hrtime.reset();

                subject = new Timer('event');

                assert.equal(subject.data.duration, null);

                process.hrtime.withArgs([ 100000000, 0 ]).returns([ 0, 150025000 ]);

                subject.end().should.equal(subject);
                subject.data.duration.should.equal(150.025);

                subject.end().should.equal(subject);

                process.hrtime.calledTwice.should.be.true;
            });
        }
    });

    // ----------

    describe('#wrap()', function() {

        it('should wrap a function', function() {
            subject = new Timer('event');

            var spy = sinon.stub().returns(42);
            var wrapped = subject.wrap(spy);

            spy.called.should.be.false;
            wrapped().should.equal(42);
            spy.called.should.be.true;
        });

        it('should pass through any arguments', function() {
            subject = new Timer('event');

            var spy = sinon.spy();
            var wrapped = subject.wrap(spy);

            wrapped(null, "hello");
            spy.calledWith(null, "hello").should.be.true;
        });

        it('should use the same `this`', function() {
            subject = new Timer('event');

            var obj = {};
            var spy = sinon.spy();
            var wrapped = subject.wrap(spy);

            wrapped.call(obj, null, "hello");
            spy.calledOn(obj).should.be.true;
        });

        it('should end the timer', function(done) {
            Timer.prototype.USE_HRTIME = false;
            Date.now.returns(98);
            subject = new Timer('event');
            Date.now.returns(140);
            process.nextTick(subject.wrap(function() {
                subject.data.duration.should.equal(42);
                done();
            }))
        })

        if(HRTIME_AVAIL) {
            it('should end the timer using process.hrtime()', function(done) {
                Timer.prototype.USE_HRTIME = true;

                process.hrtime.returns([100, 100]);

                subject = new Timer('event');

                process.hrtime.withArgs([ 100, 100 ]).returns([ 0, 150025000 ]);

                process.nextTick(subject.wrap(function() {
                    subject.data.duration.should.equal(150.025);
                    done();
                }))
            });
        }
    });

    // ----------

    describe('#getSubTimer()', function() {

        var sub1, sub2, sub3, sub4;

        beforeEach(function() {
            sub1 = subject.split('aaa');
            sub2 = sub1.split('bbb');
            sub3 = sub1.split('ccc');
            sub4 = subject.split('ccc');
        });

        it('should return nothing if there is no match non-recursively', function() {
            assert.equal(subject.getSubTimer('bbb'), null);
        });

        it('should return nothing if there is no match recursively', function() {
            assert.equal(subject.getSubTimer('zzz', true), null);
        });

        it('should return first timer that matches the name non-recursively', function() {
            subject.getSubTimer('ccc').should.equal(sub4);
        });

        it('should return first timer that matches the name', function() {
            subject.getSubTimer('ccc', true).should.equal(sub3);
        });
    });

    describe('#getSubTimers()', function() {

        var sub1, sub2, sub3, sub4, sub5;

        beforeEach(function() {
            sub1 = subject.split('aaa');
            sub2 = sub1.split('bbb');
            sub3 = sub1.split('ccc');
            sub4 = subject.split('ccc');
            sub5 = subject.split('ddd');
        });

        it('should return nothing if there is no match non-recursively', function() {
            subject.getSubTimers('bbb').should.eql([]);
        });

        it('should return nothing if there is no match recursively', function() {
            subject.getSubTimers('zzz', true).should.eql([]);
        });

        it('should return first timer that matches the name non-recursively', function() {
            subject.getSubTimers('ccc').should.eql([sub4]);
        });

        it('should return first timer that matches the name', function() {
            subject.getSubTimers('ccc', true).should.eql([sub3, sub4]);
        });
    });

    // ----------

    describe('#getResult()', function() {
        it('should return the deep nested result of the timer', function() {

            var subTimer1 = subject.split('subEvent');
            var subTimer2 = subject.split('subEvent');

            subTimer1.setContext({ actions: 12 });

            subject.data.duration = 300;
            subTimer1.data.duration = 135;
            subTimer2.data.duration = 165;

            subject.getResult().should.eql({
                name: 'event',
                duration: 300,
                timers: [
                    {
                        name: 'subEvent',
                        duration: 135,
                        context: { actions: 12 }
                    },
                    {
                        name: 'subEvent',
                        duration: 165
                    }
                ]
            });
        });
    });
});
