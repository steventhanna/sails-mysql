var assert = require('assert');
var _ = require('@sailshq/lodash');
var Adapter = require('../../../lib/adapter');
var Support = require('../../support/bootstrap');
/* global describe, it, before, after */

describe('Unit Tests ::', function() {
  describe('Describe', function() {
    // Test Setup
    before(function(done) {
      Support.Setup('test_describe', done);
    });

    after(function(done) {
      Support.Teardown('test_describe', done);
    });

    it('should return information on a table', function(done) {
      var hasFinished = false;
      
      Adapter.describe('test', 'test_describe', function(err, result) {
        if (hasFinished) { return; }
        
        if (err !== undefined) {
          hasFinished = true;
          return done(err);
        }

        try {
          assert(_.isPlainObject(result));
          assert(result.fieldA);
          assert(result.fieldB);
          assert(result.id);

          assert.equal(result.fieldA.type, 'text');
          assert.equal(result.fieldB.type, 'text');
          assert.equal(result.id.type, 'int');
          assert(result.id.primaryKey);
          assert(result.id.autoIncrement);
          
          hasFinished = true;
          return done();
        } catch (e) {
          hasFinished = true;
          return done(e);
        }
      });
    });
  });
});
