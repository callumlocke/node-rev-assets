# rev-assets [![Build Status](https://secure.travis-ci.org/callumlocke/rev-assets.png?branch=master)](http://travis-ci.org/callumlocke/rev-assets)

> Generic tool for revving static assets and updating corresponding HTML elements.

## Getting Started

`$ npm install rev-assets`

```javascript
var revAssets = require('rev-assets');

revAssets('dist/**/*.html', function (err, htmlFiles, assets) {
  if (err) throw err;
  
  // htmlFiles is an array of Vinyl file objects (containing updated markup)
  // assets is a hash of original file path => renamed file path
});
```

The `revAssets` function doesn't actually write anything to disk, it just provides data you can use to rename your assets and rewrite your HTML.


## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality.

## Release History
_(Nothing yet)_

## License
Copyright (c) 2014 Callum Locke. Licensed under the MIT license.
