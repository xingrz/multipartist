Multipartist
==========

Multipartist is a library to build multipart data, with streaming APIs.

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

## Installation

```
npm install multipartist
```

## Requirements

- **[Node](http://nodejs.org)** >= 0.10

## API Documentation

### multipartist(type)

Create a Multipartist instance.

#### Arguments

- **type** String - Multipart type (e.g. `form-data`, `related`, `mixed`, etc...)

#### Returns

Multipartist - an Multipartist instance

### Multipartist#add([headers, ]content[, length])

Add a part.

#### Arguments

- ***headers*** Object - Optional. Headers of this part
- **content** String | Buffer | [stream.Readable](http://nodejs.org/api/stream.html#stream_class_stream_readable) - Content of this part
- ***length*** Number - Optional. Length of the content of this part. It is better to specific the length of a `stream.Readable` part explicitly. Otherwise, the `Content-Length` of the whole multipart payload would not be caculated.

#### Returns

Multipartist - the Multipartist instance itself

### Multipartist#headers([additions])

Returns all auto-generated headers.

#### Arguments

- ***headers*** Object - Optional. Additional headers

#### Returns

- Object - Headers

## Contributing

See [CONTRIBUTING](CONTRIBUTING) file.

## Running Tests

```
make test
```

## License

Multipartist is released under the MIT License. See the bundled [LICENSE](LICENSE) file for details.
