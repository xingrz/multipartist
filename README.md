Multipartist
==========

[![][travis-img]][travis-url] [![][coveralls-img]][coveralls-url] [![][npm-version]][npm-url] [![][npm-downloads]][npm-url] [![][license-img]][license-url] [![][issues-img]][issues-url]

Build multipart stream, with stream.

## Requirements

Node >= 4, tested on latest Node and latest LTS Node.

## Installation

```sh
npm install --save multipartist
```

## Usage



```js
var multipartist = require('multipartist')
  , request = require('request') // or other http request lib you like
  , fs = require('fs')

// for example: https://developers.google.com/glass/media-upload#multipart
var endPoint = 'https://www.googleapis.com/upload/mirror/v1/timeline?uploadType=multipart'

var multipart = multipartist('related')
  .add({
    'Content-Type': 'application/json'
  }, JSON.stringify({
    'text': 'Hello world!'
  }))
  .add({
    'Content-Type': 'image/jpeg'
  , 'Content-Length': fs.statSync('./logo.png').size
  }, fs.createReadStream('./logo.png'))

multipart.pipe(request.post(endPoint, {
  headers: multipart.headers({
    'Authorization': 'Bearer 1asdfvaddf23098c9vasd9f'
  })
}))
```


## API

### multipartist(type)

Create a Multipartist instance.

Multipartist itself is an subclass of [Readable Stream](https://nodejs.org/dist/latest/docs/api/stream.html#stream_readable_streams).

#### Arguments

- **type** String - Multipart type (e.g. `form-data`, `related`, `mixed`, etc...)

#### Returns

Multipartist - an Multipartist instance

### Multipartist#append([name, ]content[, length][, headers])

Add a part.

#### Arguments

- **content** String | Buffer | [Readable](https://nodejs.org/dist/latest/docs/api/stream.html#stream_class_stream_readable) - Content of this part
- ***name*** String - Name of this part, only required for multipart/form-data.
- ***length*** Number - Optional. Length of the content of this part. It's better to specific the length of a `Readable` part explicitly. Otherwise, the `Content-Length` of the whole multipart payload would not be caculated.
- ***headers*** Object - Optional. Additional headers of this part

#### Returns

Multipartist - the Multipartist instance itself

### Multipartist#headers([additions])

Returns all auto-generated headers.

#### Arguments

- ***headers*** Object - Optional. Additional headers

#### Returns

- Object - Headers

## Test

```sh
npm test
```

## License

This project is released under the terms of [MIT License](LICENSE).


[travis-img]: https://img.shields.io/travis/xingrz/multipartist/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/xingrz/multipartist
[coveralls-img]: https://img.shields.io/coveralls/xingrz/multipartist/master.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/xingrz/multipartist
[npm-version]: https://img.shields.io/npm/v/multipartist.svg?style=flat-square
[npm-downloads]: https://img.shields.io/npm/dm/multipartist.svg?style=flat-square
[npm-url]: https://www.npmjs.org/package/multipartist
[license-img]: https://img.shields.io/npm/l/multipartist.svg?style=flat-square
[license-url]: LICENSE
[issues-img]: https://img.shields.io/github/issues/xingrz/multipartist.svg?style=flat-square
[issues-url]: https://github.com/xingrz/multipartist/issues
