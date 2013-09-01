/*!
 * multipartist - lib/multipartist.js
 * Copyright(c) 2013 XiNGRZ <chenxingyu92@gmail.com>
 * MIT Licensed
 */

"use strict"

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

var Readable = require('stream').Readable
  , util = require('util').util

var PADDING = '--'
  , NEW_LINE = '\r\n'
  , NEW_LINE_BUFFER = new Buffer(NEW_LINE)

exports = module.exports = Multipartist
Multipartist.Multipartist = Multipartist

function Multipartist (type) {
  if (!(this instanceof Multipartist)) {
    return new Multipartist(type)
  }

  Multipartist.super_.call(this)

  this.parts = []
  this.length = 0
  this.isContentLengthKnown = true
  this.type = type

  this._boundary = _boundary()

  this._ending = _ending()
  this.length += this._ending.length

  this._active = false
  this._end = false
}

util.inherits(Multipartist, Readable)

Multipartist.prototype.add = function (headers, content, length) {
  if (arguments.length <= 2) {
    length = content
    content = headers
    headers = {}
  }

  var leading = _leading(this.boundary, headers)
  this.length += leading.length
  this.length += NEW_LINE_BUFFER.length * 2

  if (content instanceof Readable) {
    if (length) {
      this.length += length
    }
    else {
      this.length = 0
      this.isContentLengthKnown = false
    }
  }
  else if (Buffer.isBuffer(content)) {
    this.length += content.length
  }
  else {
    content = new Buffer(content)
    this.length += content.length
  }

  this.parts.push([leading, NEW_LINE_BUFFER, content, NEW_LINE_BUFFER])
}

Multipartist.prototype.headers = function (additions) {
  var headers = {}

  headers['Content-Type'] = util.format(
    'multipart/%s; boundary="%s"'
  , this.type
  , this._boundary
  )

  if (this.isContentLengthKnown) {
    headers['Content-Length'] = this.length
  }

  Object.keys(additions).forEach(function (key) {
    headers[key] = additions[key]
  })

  return headers
}

Multipartist.prototype._read = function () {
  while (this._active) {
    var part = this.parts[0]
    if (part) {
      var clip = part.shift()
      if (clip) {
        this._active = this.push(clip)
      }
      else {
        this.parts.shift()
      }
    }
    else if (!this._end) {
      this._active = this.push(this._ending)
      this._end = true
    }
    else {
      this._active = false
      this.push(null)
    }
  }
}

function _boundary () {
  var boundary = '--------------------------'

  for (var i = 24; i--;) {
    boundary += Math.floor(Math.random() * 10).toString(16)
  }

  return boundary
}

function _leading (boundary, headers) {
  var leading = [PADDING + boundary]
  Object.keys(headers).forEach(function (key) {
    leading.push(util.format('%s: %s', key, headers[key]))
  })

  return new Buffer(leading.join(NEW_LINE) + NEW_LINE)
}

function _ending (boundary) {
  return new Buffer(PADDING + boundary + PADDING + NEW_LINE)
}
