Multipartist
==========

[![][travis-img]][travis-url] [![][coveralls-img]][coveralls-url] [![][npm-version]][npm-url] [![][npm-downloads]][npm-url] [![][license-img]][license-url] [![][issues-img]][issues-url]

Build multipart stream, with stream.

Unlike [form-data](https://github.com/form-data/form-data), this library provides more lower-level APIs to build not only `multipart/form-data` but also `multipart/related` and any other similar structures.

## Requirements

Node >= 4, tested on latest Node and latest LTS Node.

## Installation

```sh
npm install --save multipartist
```

## Usage

```js
import Multipart from 'multipartist';
import request from 'request';
import { createReadStream } from 'fs';

const multipart = new Multipart('form-data');

multipart.append(JSON.stringify({ 'text': 'Hello world!' }), {
  'Content-Disposition': 'form-data; name="metadata"',
  'Content-Type': 'application/json; charset=UTF-8',
});

multipart.append(createReadStream('audio.wav'), {
  'Content-Disposition': 'form-data; name="audio"',
  'Content-Type': 'application/octet-stream',
  'X-Speaker-Name': 'XiNGRZ',
});

multipart.pipe(request.post('https://api.example.com/recognize', {
  headers: multipart.headers({
    'Authorization': 'Bearer YOUR_OWN_API_KEY_HERE',
  }),
}, (req, res, body) => {
  // ...
}));
```

## API

### Class: Multipartist(type)

The Multipartist class, which is an subclass of [Readable Stream](https://nodejs.org/dist/latest/docs/api/stream.html#stream_readable_streams).

#### Arguments

- **type** String - Multipart type (e.g. `form-data`, `related`, etc...). Defaults to `form-data`.

### Multipartist#append(content[, length][, headers])

Add a part.

#### Arguments

- **content** String | Buffer | [Readable](https://nodejs.org/dist/latest/docs/api/stream.html#stream_class_stream_readable) - Content of this part
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
