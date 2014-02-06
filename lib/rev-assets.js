/*
 * rev-assets
 * https://github.com/callumlocke/node-rev-assets
 *
 * Copyright (c) 2014 Callum Locke
 * Licensed under the MIT license.
 */

'use strict';

var glob   = require('glob'),
    fs     = require('fs'),
    path   = require('path'),
    crypto = require('crypto'),
    async  = require('async'),
    _      = require('lodash'),
    Soup   = require('soup');


var attributeMap = {
  'script[src]'                : 'src',
  'link[rel=stylesheet][href]' : 'href',
  'img[src]'                   : 'src'
};


module.exports = function revAssets(pattern, callback) {
  glob(pattern, function (err, htmlFiles) {
    if (err) return callback(err);

    if (!htmlFiles.length)
      return callback(new Error('No HTML files found matching pattern'));

    var assetDigests = {},
        renamings = {},
        newHTMLContents = {};

    try {
      htmlFiles.forEach(function (htmlFile) {
        var soup = new Soup(fs.readFileSync(htmlFile).toString('utf8')),
            assetBase = path.dirname(htmlFile),
            noAssetsRenamed = true;

        _.each(attributeMap, function (attrName, selector) {
          soup.setAttribute(selector, attrName, function (assetPath) {
            if (isLocalPath(assetPath)) {
              var fullAssetPath = path.join(assetBase, assetPath);

              var assetAlreadyDiscovered = !!assetDigests[fullAssetPath];

              var digest;
              if (assetAlreadyDiscovered) {
                digest = assetDigests[fullAssetPath];
              }
              else {
                try {
                  digest = getAssetDigest(fullAssetPath);
                }
                catch (e) {
                  if (e.code === 'ENOENT') {
                    throw new Error(
                      'Couldn\'t find asset "' + assetPath + '" referenced by HTML file: ' + htmlFile
                    );
                  }
                  else throw e;
                }
                assetDigests[fullAssetPath] = digest;
              }
              
              var newAssetPath = revPath(assetPath, digest);

              if (!assetAlreadyDiscovered)
                renamings[fullAssetPath] = path.join(assetBase, newAssetPath);

              noAssetsRenamed = false;
              return newAssetPath;
            }

            return null;
          });
        });

        if (!noAssetsRenamed)
          newHTMLContents[htmlFile] = soup.toString();
      });
    }
    catch (e) {
      callback(e);
      return;
    }

    // Carry out all the renamings, and write all the new HTML files, then call back
    var htmlFilesWritten = _.keys(newHTMLContents),
        oldAssetNames = _.keys(renamings);

    async.parallel([
      function (renamedAssets) {
        async.each(oldAssetNames, function (oldName, renamed) {
          fs.rename(oldName, renamings[oldName], renamed);
        }, renamedAssets);
      },
      function (savedHTMLFiles) {
        async.each(htmlFilesWritten, function (htmlFile, written) {
          fs.writeFile(htmlFile, newHTMLContents[htmlFile], written);
        }, savedHTMLFiles);
      }
    ], function (err) {
      // Callback with a report object
      callback(err, {
        filesWritten: htmlFilesWritten,
        filesRenamed: renamings
      });
    });
  });
};


// Helper functions
function revPath(url, digest) {
  var index = url.lastIndexOf('.');
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
  return (
    hash.digest('base64')
      .substring(0, length)
      .replace('+', '_', 'g')
      .replace('=', '-', 'g')
  );
}

function getAssetDigest(filePath) {
  return sha1(fs.readFileSync(filePath), 8);
}
