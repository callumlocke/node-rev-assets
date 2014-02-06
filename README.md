# rev-assets [![Build Status](https://secure.travis-ci.org/callumlocke/rev-assets.png?branch=master)](http://travis-ci.org/callumlocke/rev-assets)

> Renames static assets with a revision hash, and updates the respective HTML attributes.

## Getting Started

`$ npm install rev-assets`

```javascript
var revAssets = require('rev-assets');

revAssets('dist/**/*.html', function (err) {
  if (err) throw err;
  
  // Assets are now revved.
});
```

The revAssets function scans your HTML file(s) for static assets (scripts, stylesheets and images) that are referenced by relative paths. It then renames the actual asset files (to something like `foo.iu3h49ns.js`) and updates the relevant HTML attributes accordingly. Then it fires your callback.

Your callback takes takes up to two arguments: an error (which will be `null` if everything worked), and a `results` object, which you can inspect if you want to see which assets were renamed and which HTML files were rewritten.


## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality.

## Release History
_(Nothing yet)_

## License
Copyright (c) 2014 Callum Locke. Licensed under the MIT license.
