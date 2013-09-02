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
  , through = require('through')
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

  this.type = type
  this.parts = []
  this.isContentLengthKnown = true

  this._boundary = _boundary()
  this._ending = _ending(this._boundary)
}

util.inherits(Multipartist, Readable)

Multipartist.prototype.add = function (headers, content, length) {
  if (arguments.length <= 2) {
    length = content
    content = headers
    headers = {}
  }

  if (isStream(content)) {
    if (!length) {
      this.isContentLengthKnown = false
    }

    var paused = through().pause()
    content.pipe(paused)

    this.parts.push([headers, paused, length])
  }
  else {
    if (!Buffer.isBuffer(content)) {
      content = new Buffer(content)
    }

    this.parts.push([headers, content])
  }

  return this
}

Multipartist.prototype.headers = function (additions) {
  var headers = {}

  headers['Content-Type'] = util.format(
    'multipart/%s; boundary="%s"'
  , this.type
  , this._boundary
  )

  if (this.isContentLengthKnown) {
    var length = this._ending.length

    parts.forEach(function (part) {
      length += part[0].length
      length += NEW_LINE_BUFFER * 2
      length += part[2] ? part[2] : part[1].length
    })

    headers['Content-Length'] = length.toString()
  }

  Object.keys(additions).forEach(function (key) {
    headers[key] = additions[key]
  })

  return headers
}

Multipartist.prototype.drain = function () {
  var part = this.parts.shift()
  if (part) {
    if (Buffer.isBuffer(part[1])) {
      this._emitBuffer(part)
    }
    else {
      this._emitStream(part)
    }
  }
  else {
    this._end()
  }

  return this
}

Multipartist.prototype.resume = function () {
  this.paused = false

  if (!this._draining) {
    this._draining = true
    this.drain()
  }

  return this
}

Multipartist.prototype._emitBuffer = function (part) {
  this.emit('data', _leading(this._boundary, part[0]))
  this.emit('data', NEW_LINE_BUFFER)
  this.emit('data', part[1])
  this.emit('data', NEW_LINE_BUFFER)
  process.nextTick(self.drain.bind(self))
}

Multipartist.prototype._emitStream = function (part) {
  var self = this

  self.emit('data', _leading(this._boundary, part[0]))
  self.emit('data', NEW_LINE_BUFFER)

  part[1]
    .on('data', function (chunk) {
      self.emit('data', chunk)
    })
    .once('end', function () {
      self.emit('data', NEW_LINE_BUFFER)
      process.nextTick(self.drain.bind(self))
    })
    .resume()
}

Multipartist.prototype._end = function () {
  this.emit('data', this._ending)
  this.emit('end')
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

function isStream (object) {
  return 'function' == typeof object.pipe
}
