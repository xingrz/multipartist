import 'should';

import Multipart from '../es/multipartist';
import { Form } from 'multiparty';
import pond from 'pond';
import RandomStream from './RandomStream';

// Hack multiparty to assume we're a IncomingMessage
function hackHeaders(multipart) {
  const result = {};
  const headers = multipart.headers();
  Object.keys(headers).forEach((key) => {
    result[key.toLowerCase()] = headers[key];
  });
  multipart.headers = result;
}

describe('multipartist', () => {

  it('should throws if append an unsupported type', () => {
    const multipart = new Multipart('form-data');
    (() => multipart.append(123456)).should.throw();
  });

  it('should have proper Content-Type for multipart/related', () => {
    const multipart = new Multipart('related');
    multipart.append('foo');
    const headers = multipart.headers();
    headers.should.have.key('Content-Type');
    headers['Content-Type'].should.startWith('multipart/related; boundary="');
  });

  it('should have proper Content-Type for multipart/form-data', () => {
    const multipart = new Multipart('form-data');
    multipart.append('foo');
    const headers = multipart.headers();
    headers.should.have.key('Content-Type');
    headers['Content-Type'].should.startWith('multipart/form-data; boundary="');
  });

  it('should have proper headers with certain length', () => {
    const multipart = new Multipart();
    multipart.append('foo');
    const headers = multipart.headers({ 'X-Another-Field': 'Hello' });
    headers.should.have.key('Content-Type');
    headers.should.have.key('Content-Length');
    headers.should.have.value('X-Another-Field', 'Hello');
  });

  it('should works with strings and buffers', (done) => {
    const multipart = new Multipart('form-data');

    const buffer = Buffer.from('12345678', 'utf8');

    multipart.append('bar', {
      'Content-Disposition': `form-data; name="foo"`,
    });
    multipart.append('world', {
      'Content-Disposition': `form-data; name="hello"`,
      'X-Part-Addition': 'Hello World'
    });
    multipart.append(buffer, {
      'Content-Disposition': `form-data; name="buffer"`,
    });

    hackHeaders(multipart);
    multipart.headers.should.have.key('content-type');
    multipart.headers.should.have.key('content-length');

    const form = new Form();

    let parts = 0;
    const contents = {};
    const headers = {};

    const assert = () => {
      contents.should.have.value('foo', 'bar');
      contents.should.have.value('hello', 'world');
      contents.should.have.value('buffer', '12345678');

      headers.should.have.key('foo');
      headers.should.have.key('hello');
      headers.should.have.key('buffer');

      headers.foo.should.have.value('content-disposition', 'form-data; name="foo"');
      headers.foo.should.not.have.key('x-part-addition');

      headers.hello.should.have.value('content-disposition', 'form-data; name="hello"');
      headers.hello.should.have.value('x-part-addition', 'Hello World');

      headers.buffer.should.have.value('content-disposition', 'form-data; name="buffer"');
      headers.buffer.should.not.have.key('x-part-addition');

      done();
    };

    form.on('part', async (part) => {
      try {
        const content = await part.pipe(pond()).spoon();
        contents[part.name] = content.toString('utf8');
        headers[part.name] = part.headers;
        parts++;

        if (parts == 3) {
          assert();
        }
      } catch (e) {
        done(e);
      }
    });

    form.once('error', (err) => done(err));
    form.parse(multipart);
  });

  it('should works with streams', (done) => {
    const multipart = new Multipart('form-data');

    const stream1 = new RandomStream();
    const stream2 = new RandomStream();

    multipart.append(Buffer.from('1234', 'hex'), {
      'Content-Disposition': `form-data; name="foo1"`,
    });
    multipart.append(stream1, {
      'Content-Disposition': `form-data; name="stream1"`,
      'X-Part-Addition': 'Hello World',
    });
    multipart.append(Buffer.from('3456', 'hex'), {
      'Content-Disposition': `form-data; name="foo2"`,
    });
    multipart.append(stream2, 200, {
      'Content-Disposition': `form-data; name="stream2"`,
    });
    multipart.append(Buffer.from('5678', 'hex'), {
      'Content-Disposition': `form-data; name="foo3"`,
    });

    hackHeaders(multipart);
    multipart.headers.should.have.key('content-type');
    multipart.headers.should.not.have.key('content-length');

    const form = new Form();

    let parts = 0;
    const contents = {};
    const headers = {};

    const assert = () => {
      contents.should.have.value('foo1', '1234');
      contents.should.have.value('stream1', stream1.concat().toString('hex'));
      contents.should.have.value('foo2', '3456');
      contents.should.have.value('stream2', stream2.concat().toString('hex'));
      contents.should.have.value('foo3', '5678');

      headers.should.have.key('foo1');
      headers.should.have.key('stream1');
      headers.should.have.key('foo2');
      headers.should.have.key('stream2');
      headers.should.have.key('foo3');

      headers.foo1.should.have.value('content-disposition', 'form-data; name="foo1"');
      headers.foo1.should.not.have.key('x-part-addition');

      headers.stream1.should.have.value('content-disposition', 'form-data; name="stream1"');
      headers.stream1.should.have.value('x-part-addition', 'Hello World');

      headers.foo2.should.have.value('content-disposition', 'form-data; name="foo2"');
      headers.foo2.should.not.have.key('x-part-addition');

      headers.stream2.should.have.value('content-disposition', 'form-data; name="stream2"');
      headers.stream2.should.not.have.key('x-part-addition');

      headers.foo3.should.have.value('content-disposition', 'form-data; name="foo3"');
      headers.foo3.should.not.have.key('x-part-addition');

      done();
    };

    form.on('part', async (part) => {
      try {
        const content = await part.pipe(pond()).spoon();
        contents[part.name] = content.toString('hex');
        headers[part.name] = part.headers;
        parts++;

        if (parts == 5) {
          assert();
        }
      } catch (e) {
        done(e);
      }
    });

    form.once('error', (err) => done(err));
    form.parse(multipart);
  });

  it('should have content-length if length of all streams are known', () => {
    const multipart = new Multipart('form-data');

    const stream1 = new RandomStream(20, 5);
    const stream2 = new RandomStream(20, 5);

    multipart.append('bar', {
      'Content-Disposition': `form-data; name="foo"`,
    });
    multipart.append(stream1, 20 * 5, {
      'Content-Disposition': `form-data; name="stream1"`,
    });
    multipart.append(stream2, 20 * 5, {
      'Content-Disposition': `form-data; name="stream2"`,
    });

    hackHeaders(multipart);
    multipart.headers.should.have.key('content-type');
    multipart.headers.should.have.key('content-length');

    parseInt(multipart.headers['content-length']).should.greaterThan(200);
  });

  it('should not have content-length if any stream length is unknown', () => {
    const multipart = new Multipart('form-data');

    const stream1 = new RandomStream(20, 5);
    const stream2 = new RandomStream(20, 5);

    multipart.append('bar', {
      'Content-Disposition': `form-data; name="foo"`,
    });
    multipart.append(stream1, 20 * 5, {
      'Content-Disposition': `form-data; name="stream1"`,
    });
    multipart.append(stream2, {
      'Content-Disposition': `form-data; name="stream2"`,
    });

    hackHeaders(multipart);
    multipart.headers.should.have.key('content-type');
    multipart.headers.should.not.have.key('content-length');
  });

});
