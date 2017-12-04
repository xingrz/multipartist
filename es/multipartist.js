/*!
 * multipartist - lib/multipartist.js
 * Copyright(c) 2013-2017 XiNGRZ <chenxingyu92@gmail.com>
 * MIT Licensed
 */

/**
 * output example:
 *
My-Custom-Header: custom_header_content
Content-Type: multipart/related; boundary="MultipartistBoundary5769293611663"
Content-Length: number_of_bytes_in_entire_request_body

--MultipartistBoundary5769293611663
Content-Type: application/json; charset=UTF-8

<PART-CONTENT>

--MultipartistBoundary5769293611663
Content-Type: image/jpeg

<JPEG data>

--MultipartistBoundary5769293611663--
 *
 */

import { Readable } from 'stream';
import debug from 'debug';

const PADDING = '--';
const CRLF = '\r\n';
const CRLF_BUFFER = Buffer.from(CRLF);

const dbg = debug('multipartist');

export default class Multipartist extends Readable {

  chunks = [];
  contentLengthKnown = true;

  _currentStream = null;

  constructor(type = 'form-data', options) {
    super(options);
    this.type = type;
    this.boundary = boundary();
    this.ending = ending(this.boundary);
    this.contentLength = this.ending.length;
    dbg('generated boundary %s', this.boundary);
    dbg('generated ending %s', this.ending.toString());
  }

  append(content, length, headers) {
    if (typeof length != 'number') {
      headers = length;
      length = null;
    }

    headers = { ...headers };

    dbg('part headers %O', headers);

    if (content instanceof Readable) {
      content.pause();
      if (!length) {
        this.contentLengthKnown = false;
      }
      dbg('part content: Readable, length = %d', length);
    } else if (typeof content == 'string') {
      content = Buffer.from(content);
      length = content.length;
      dbg('part content: String -> Buffer, length = %d', length);
    } else if (Buffer.isBuffer(content)) {
      length = content.length;
      dbg('part content: Buffer, length = %d', length);
    } else {
      throw new Error('Content of part must be a Readable, String or Buffer');
    }

    const header = leading(this.boundary, headers);

    this.contentLength += header.length + CRLF_BUFFER.length;
    this.contentLength += length + CRLF_BUFFER.length;

    this.chunks.push(header);
    this.chunks.push(CRLF_BUFFER);
    this.chunks.push(content);
    this.chunks.push(CRLF_BUFFER);
  }

  headers(additions) {
    const headers = {
      'Content-Type': `multipart/${this.type}; boundary="${this.boundary}"`,
    };

    if (this.contentLengthKnown) {
      headers['Content-Length'] = `${this.contentLength}`;
    }

    dbg('generated headers %O', headers);
    dbg('additional headers %O', additions);

    return {
      ...headers,
      ...additions,
    };
  }

  _read() {
    if (this._currentStream) {
      this._readStream();
      return;
    }

    if (this.chunks.length == 0) {
      dbg('ending');
      this.push(this.ending);
      this.push(null);
      return;
    }

    const chunk = this.chunks.shift();
    if (chunk instanceof Readable) {
      dbg('start streaming');
      this._startStream(chunk);
    } else {
      this.push(chunk);
    }
  }

  _startStream(stream) {
    this._currentStream = stream;

    stream.on('readable', () => {
      this._readStream();
    });

    stream.on('end', () => {
      dbg('stream end');
      this._currentStream = null;
      this._read();
    });
  }

  _readStream() {
    const stream = this._currentStream;
    const chunk = stream.read();
    if (chunk != null) {
      this.push(chunk);
    }
  }

}

function boundary() {
  var boundary = '--------------------------';

  for (let i = 0; i < 25; i++) {
    boundary += Math.floor(Math.random() * 10).toString(16);
  }

  return boundary;
}

function leading(boundary, headers) {
  var leading = [`${PADDING}${boundary}`];

  Object.keys(headers).forEach(function (key) {
    leading.push(`${key}: ${headers[key]}`);
  });

  return Buffer.from(`${leading.join(CRLF)}${CRLF}`);
}

function ending(boundary) {
  return Buffer.from(`${PADDING}${boundary}${PADDING}${CRLF}`);
}
