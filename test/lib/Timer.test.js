
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

        sinon = Sinon.sandbox.create({useFakeTimers: false});

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

    describe('#setContext()', function() {
        it('should store the passed context to the data', function() {

            assert.equal(subject.data.context, undefined);

            var context = { foo: 1, bar: 2 };
            subject.setContext(context).should.equal(subject);
            subject.data.context.should.equal(context);
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

            var subTimer2 = subject.split('subEvent');
            subTimer2.data.name.should.equal('subEvent');
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
            it('should store name and start time using process.hrtime()', function() {

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
