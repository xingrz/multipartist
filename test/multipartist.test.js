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

    form.on('part', (part) => {
      contents[part.name] = part.pipe(pond()).spoon();
      headers[part.name] = part.headers;
      parts++;
    });

    form.on('close', async () => {
      try {
        parts.should.be.eql(3);

        (await contents.foo).toString('utf8').should.be.eql('bar');
        (await contents.hello).toString('utf8').should.be.eql('world');
        (await contents.buffer).toString('utf8').should.be.eql('12345678');

        headers.should.be.eql({
          foo: {
            'content-disposition': 'form-data; name="foo"',
          },
          hello: {
            'content-disposition': 'form-data; name="hello"',
            'x-part-addition': 'Hello World',
          },
          buffer: {
            'content-disposition': 'form-data; name="buffer"',
          },
        });

        done();
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

    form.on('part', (part) => {
      contents[part.name] = part.pipe(pond()).spoon();
      headers[part.name] = part.headers;
      parts++;
    });

    form.on('close', async () => {
      try {
        parts.should.be.eql(5);

        (await contents.foo1).toString('hex').should.be.eql('1234');
        (await contents.stream1).toString('hex').should.be.eql(stream1.concat().toString('hex'));
        (await contents.foo2).toString('hex').should.be.eql('3456');
        (await contents.stream2).toString('hex').should.be.eql(stream2.concat().toString('hex'));
        (await contents.foo3).toString('hex').should.be.eql('5678');

        headers.should.be.eql({
          foo1: {
            'content-disposition': 'form-data; name="foo1"',
          },
          stream1: {
            'content-disposition': 'form-data; name="stream1"',
            'x-part-addition': 'Hello World',
          },
          foo2: {
            'content-disposition': 'form-data; name="foo2"',
          },
          stream2: {
            'content-disposition': 'form-data; name="stream2"',
          },
          foo3: {
            'content-disposition': 'form-data; name="foo3"',
          },
        });

        done();
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

  it('should keep open until flush() if endOnEmpty = false', (done) => {
    const multipart = new Multipart('form-data', { endOnEmpty: false });

    const stream = new RandomStream();

    const form = new Form();

    let parts = 0;
    const contents = {};

    form.on('part', (part) => {
      contents[part.name] = part.pipe(pond()).spoon();
      parts++;
    });

    form.on('close', async () => {
      try {
        parts.should.be.eql(2);
        (await contents.foo).toString('utf8').should.be.eql('bar');
        (await contents.hello).toString('hex').should.be.eql(stream.concat().toString('hex'));
        done();
      } catch (e) {
        done(e);
      }
    });

    hackHeaders(multipart);
    multipart.headers.should.not.have.key('content-length');

    form.once('error', (err) => done(err));
    form.parse(multipart);

    setTimeout(() => {
      multipart.append('bar', {
        'Content-Disposition': `form-data; name="foo"`,
      });
    }, 500);

    setTimeout(() => {
      multipart.append(stream, {
        'Content-Disposition': `form-data; name="hello"`,
      });
    }, 1000);

    setTimeout(() => {
      multipart.flush();
    }, 1500);
  });

});
