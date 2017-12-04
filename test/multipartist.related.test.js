import 'should';

import Multipartist from '../es/multipartist';

describe('multipart/related', () => {

  it('should not throws if append without a name', () => {
    const multipart = new Multipartist('related');
    (() => multipart.append('content')).should.not.throw();
  });

  it('should throws if append an unsupported type', () => {
    const multipart = new Multipartist('form-data');
    (() => multipart.append(123456)).should.throw();
  });

  it('should have proper Content-Type', () => {
    const multipart = new Multipartist('related');
    multipart.append('bar', 'foo');
    const headers = multipart.headers();
    headers.should.have.key('Content-Type');
    headers['Content-Type'].should.startWith('multipart/related; boundary="');
  });

});
