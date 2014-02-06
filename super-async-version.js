/*
 * rev-assets
 * https://github.com/callumlocke/node-rev-assets
 *
 * Copyright (c) 2014 Callum Locke
 * Licensed under the MIT license.
 */

'use strict';

var glob = require('glob'),
    fs = require('fs'),
    path = require('path'),
    async = require('async'),
    crypto = require('crypto'),
    cheerio = require('cheerio'),
    _ = require('lodash'),
    Soup = require('soup');



var map = {
  'script[src]': 'src',
  'link[rel=stylesheet][href]': 'href',
  'img[src]': 'src'
};

function revPath(url, digest) {
  var index = url.lastIndexOf('.');
  console.log('URL', url, index);
  if (index < 0) return url + '.' + digest;
  return url.substring(0, index) + '.' + digest + url.substring(index);
}

function isLocalPath(url) {
  return (
    url.length &&
    url.indexOf('//') === -1 &&
    url.indexOf(':') === -1 &&
    url.charAt(0) !== '/'
  );
}

function sha1(buffer, length) {
  var hash = crypto.createHash('sha1');
  hash.update(buffer);
  return hash.digest('base64').substring(0, length).replace('+', '_', 'g').replace('=', '-', 'g');
}

module.exports = function revAssets(htmlFilePattern, callback) {
  glob(htmlFilePattern, function (err, htmlFilePaths) {
    if (err) return callback(err);

    console.log('htmlFilePaths', htmlFilePaths);

    if (!htmlFilePaths || !htmlFilePaths.length)
      return callback(new Error('No HTML files found matching pattern'));

    async.map(
      htmlFilePaths,
      function (htmlFilePath, done) {
        fs.readFile(htmlFilePath, function (err, contents) {
          if (err) done(err);

          // Make a list of assets found in this file
          var html = contents.toString('utf8'),
              $ = cheerio.load(html),
              assets = [];

          _.each(map, function (attrName, selector) {
            $(selector).each(function () {
              var url = $(this).attr(attrName);
              if (isLocalPath(url)) assets.push(url);
            });
          });


          done(null, {
            path: htmlFilePath,
            assets: _.uniq(assets),
            html: html
          });
        });
      },
      function (err, htmlFiles) {
        if (err) callback(err);
        console.log('GOT LIST OF ASSETS FOR EACH FILE', htmlFiles);

        var renamings = {};

        async.each(htmlFiles, function (htmlFile, processedHTMLFile) {
          // Process this HTML file
          var assetBase = path.dirname(htmlFile.path);

          async.each(htmlFile.assets, function (assetPath, doneAsset) {
            // Read this asset to establish its new filename
            var fullAssetPath = path.join(assetBase, assetPath);
            fs.readFile(fullAssetPath, function (err, contents) {
              if (err && err.code === 'ENOENT') {
                console.warn('File not found: ' + fullAssetPath);
                htmlFile.assets.map(function (a) {
                  return a === assetPath ? null : a;
                });
                return doneAsset(null); // not found, but that's OK...?
              }
              if (err) return doneAsset(err);

              // Prepare this asset file's new name
              if (!renamings[assetPath]) {
                var digest = sha1(contents, 8); // todo: get length from options
                var newPath = revPath(assetPath, digest);
                renamings[fullAssetPath] = newPath; // this might overwrite reused ones; that's fine
                doneAsset(err);
              }
            });
          }, processedHTMLFile);

        }, function (err) {
          if (err) callback(err);

          // All reading and digesting has been done.
          // We now just need to (a) rename the asset files, and (b) rewrite the HTML.

          async.parallel([
            // Rename all the files
            function (allAssetsRenamed) {
              var oldNames = _.keys(renamings);

              console.log('OLD NAMES', oldNames);

              async.each(_.unique(oldNames), function (oldName, assetRenamed) {
                console.log('RENAMING', oldName);
                fs.rename(oldName, renamings[oldName], function (err) {
                  assetRenamed(err);
                });
              }, allAssetsRenamed);
            },

            // Rewrite all the HTML files
            function (htmlFilesRewritten) {
              async.each(htmlFiles, function (htmlFile, fileRewritten) {
                var soup = new Soup(htmlFile.html);
                _.each(map, function (attrName, selector) {
                  soup.setAttribute(selector, attrName, function (oldPath) {
                    return renamings[oldPath]; // if undefined, soup will leave it unchanged
                  });
                });

                fs.writeFile(htmlFile.path, soup.toString(), function (err) {
                  fileRewritten(err);
                });
              }, htmlFilesRewritten);
            }

          ], function (err) {

            // Everything is now done.
            callback(err);
          });
        });
      }
    );
  });
};
