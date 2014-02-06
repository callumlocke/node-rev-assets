/*global describe, it*/
/*jshint expr:true*/
'use strict';

var revAssets = require('../lib/rev-assets.js'),
    path = require('path'),
    _ = require('lodash'),
    expect = require('chai').expect;

describe('revAssets function', function() {
  var fixtureDir = path.join(__dirname, 'fixtures');

  describe('basic functionality', function () {
    var basicDir = path.join(fixtureDir, 'basic');

    it('works when all the files are present', function (done) {
      revAssets(path.join(basicDir, '*.html'), function (err, htmlFiles, assets) {
        expect(err).to.not.exist;
        expect(htmlFiles.length).to.equal(2);
        expect(_.size(assets)).to.equal(5);

        // console.log('htmlFiles[0]\n', htmlFiles[0].contents.toString('utf8'));
        // console.log('assets\n', assets);

        done();
      });
    });
  });

  describe('dodgy input', function() {
    var brokenDir = path.join(fixtureDir, 'broken');

    it('returns a helpful error when an asset is missing', function (done) {
      revAssets(path.join(fixtureDir, 'broken', '*.html'), function (err) {
        expect(err).to.exist;
        expect(err.message).to.have.string('Couldn\'t find asset "foo.css"');
        done();
      });
    });
  });
});
