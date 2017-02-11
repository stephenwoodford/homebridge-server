/* eslint-env node, mocha */

var should = require('chai').should(),
    supertest = require('supertest'),
    api = supertest('http://localhost:8765'),
    EventSource = require('eventsource');

describe('Testing the JSON API', function() {
    describe('/api/nonexisting', function() {
        it('returns an error when the method is unknown', function(done) {
            api.get('/api/nonexisting')
            .expect(404, done);
        });
    });

    describe('/api/bridgeInfo', function() {
        it('can be subscribed to and returns bridgeInfo', function(done) {
            var es = new EventSource("http://127.0.0.1:8765/api/bridgeInfo");
            es.onmessage = function (m) {
                var result = JSON.parse(m.data);
                result.should.have.property('type', 'bridgeInfo');
                result.should.have.property('data').that.is.an('object');
                result.data.should.have.property('uptime');
                result.data.should.have.property('heap');
                result.data.should.have.property('osInfo');
                result.data.should.have.property('hbVersion');
                done();
            };
        });
    });

    describe('/api/bridgeConfig', function() {
        it('returns a JSON with bridge config', function(done) {
            api.get('/api/bridgeConfig')
            .expect(200)
            .expect('Content-Type', 'application/json')
            .end(function(err, res) {
                if (err) {
                    return done(err);
                }
                res.body.should.be.a('object');
                res.body.should.have.property('bridgePin');
                res.body.should.have.property('bridgeName');
                res.body.should.have.property('bridgeUsername');
                done();
            });
        });
    });

    describe('/api/installedPlatforms', function() {
        it('returns a JSON with a list of installed platforms', function(done) {
            api.get('/api/installedPlatforms')
            .expect(200)
            .expect('Content-Type', 'application/json')
            .end(function(err, res) {
                if (err) {
                    return done(err);
                }
                res.body.should.be.a('array');
                res.body.length.should.be.eql(1);
                res.body[0].should.have.property('platform');
                res.body[0].should.have.property('hbServer_pluginName');
                res.body[0].should.have.property('hbServer_active_flag');
                done();
            });
        });
    });

    describe('/api/accessories', function() {
        it('returns a JSON with a list of installed accessories', function(done) {
            api.get('/api/accessories')
            .expect(200)
            .expect('Content-Type', 'application/json')
            .end(function(err, res) {
                if (err) {
                    return done(err);
                }
                res.body.should.be.a('array');
                res.body.length.should.be.eql(0);
                done();
            });
        });
    });

    describe('/api/installedPlugins', function() {
        it('returns a JSON with a list of installed plugins', function(done) {
            api.get('/api/installedPlugins')
            .expect(200)
            .expect('Content-Type', 'application/json')
            .end(function(err, res) {
                if (err) {
                    return done(err);
                }
                res.body.should.be.a('array');
                res.body[0].should.have.property('name');
                res.body[0].should.have.property('version');
                res.body[0].should.have.property('latestVersion');
                res.body[0].should.have.property('isLatestVersion');
                res.body[0].should.have.property('platformUsage');
                res.body[0].should.have.property('accessoryUsage');
                res.body[0].should.have.property('description');
                res.body[0].should.have.property('author');
                res.body[0].should.have.property('homepage');
                res.body[0].should.have.property('homebridgeMinVersion');
                done();
            });
        });
    });

    describe('Adding and removing a platform works', function() {
        var newConfig = {
            "platformConfig": {
                "name": "newName",
                "key1": "value1",
                "key2": true
            },
            "plugin": "homebridge-test"
        }
        // make a copy
        var expectation = JSON.parse(JSON.stringify(newConfig.platformConfig));
        expectation.platform = newConfig.plugin;
        expectation.hbServer_active_flag = 0;
        expectation.hbServer_pluginName = 'homebridge-test';
        expectation.hbServer_confDigest = '766d1e7dfeba99b9f61cac7818e84a40475d6296d5a990043b0558c69ca4adec';

        it('can add a platform', function(done) {
            api.post('/api/addPlatformConfig')
            .send("platformConfig=" + JSON.stringify(newConfig.platformConfig))
            .send("plugin=" + newConfig.plugin)
            .expect(200)
            .end(function functionName(err, res) {
                if (err) { return done(err); }
                done();
            });
        });
        it('can fetch the added platform', function(done) {
            api.get('/api/installedPlatforms')
            .expect(200)
            .end(function(err, res) {
                if (err) { return done(err); }
                res.body.should.be.a('array').and.have.length(2);
                res.body.should.include(expectation);
                done();
            });
        })
        it('can remove the added platform', function(done) {
            api.get('/api/removePlatform?' + expectation.hbServer_confDigest)
            .expect(200)
            .end(function(err, res) {
                if (err) { return done(err); }
                res.body.success.should.be.true;
                done();
            });
        })
        it('the removed platform is no longer listed', function(done) {
            api.get('/api/installedPlatforms')
            .expect(200)
            .end(function(err, res) {
                if (err) { return done(err); }
                res.body.should.be.a('array').and.have.length(1);
                res.body.should.not.include(expectation);
                done();
            });
        })
        it('Calling remove with a invalid platform id fails', function(done) {
            api.get('/api/removePlatform?' + 'invalid')
            .expect(200)
            .end(function(err, res) {
                if (err) { return done(err); }
                res.body.success.should.be.false;
                done();
            });
        })

        // call addPlatformConfig with invalid payload
    })
});
