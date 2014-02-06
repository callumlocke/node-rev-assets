/*global describe, it, beforeEach*/
/*jshint expr:true*/
'use strict';

var revAssets = require('../lib/rev-assets.js'),
    wrench = require('wrench'),
    path = require('path'),
    rimraf = require('rimraf'),
    _ = require('lodash'),
    expect = require('chai').expect;

describe('revAssets function', function() {
  var fixtureDir = path.join(__dirname, 'fixtures'),
      outputDir = path.join(__dirname, 'output');

  wrench.mkdirSyncRecursive(outputDir);


  describe('basic functionality', function () {
    var basicDir = path.join(outputDir, 'basic');
    rimraf.sync(basicDir);
    wrench.copyDirSyncRecursive(path.join(fixtureDir, 'basic'), basicDir, {
      forceDelete: true
    });

    it('works when all the files are present', function (done) {
      var basicDir = path.join(outputDir, 'basic');

      revAssets(path.join(basicDir, '*.html'), function (err, results) {
        expect(err).to.not.exist;

        expect(results.filesWritten.length).to.equal(2);
        expect(_.size(results.filesRenamed)).to.equal(5);

        done();
      });
    });
  });


  describe('dodgy input', function() {
    var brokenDir = path.join(outputDir, 'broken');
    rimraf.sync(brokenDir);
    wrench.copyDirSyncRecursive(path.join(fixtureDir, 'broken'), brokenDir, {
      forceDelete: true
    });

    it('returns a helpful error when an asset is missing', function (done) {
      revAssets(path.join(outputDir, 'broken', '*.html'), function (err) {
        expect(err).to.exist;
        expect(err.message).to.have.string('Couldn\'t find asset "foo.css"');
        done();
      });
    });
  });
});
