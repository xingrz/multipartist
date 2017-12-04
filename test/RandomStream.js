import { Readable } from 'stream';
import { randomBytes } from 'crypto';

export default class RandomStream extends Readable {

  pushed = [];

  constructor(length = 20, count = 5) {
    super();
    this.length = length;
    this.count = count;
  }

  _read() {
    this._generate();
  }

  _generate() {
    if (this.pushed.length >= this.count) {
      return this.push(null);
    }

    randomBytes(this.length, (err, bytes) => {
      if (err) {
        process.nextTick(() => this.emit('error', err));
        return;
      }

      this.pushed.push(bytes);
      this.push(bytes);
    });
  }

  concat() {
    return Buffer.concat(this.pushed);
  }

}
