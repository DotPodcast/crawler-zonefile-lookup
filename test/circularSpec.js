import { describe, it } from 'mocha';
import { expect } from 'chai';

import circular from '../src/circular';

describe('Circular', () => {
  it('should create an infinite repeated sequence', () => {
    const input = [1, 2, 3];
    const c = circular.from(input);

    expect(c.next()).to.equal(input[0]);
    expect(c.next()).to.equal(input[1]);
    expect(c.next()).to.equal(input[2]);
    expect(c.next()).to.equal(input[0]);
    expect(c.next()).to.equal(input[1]);
    expect(c.next()).to.equal(input[2]);
  });

  it('should handle lists of 1', () => {
    const input = [1];
    const c = circular.from(input);

    expect(c.next()).to.equal(input[0]);
    expect(c.next()).to.equal(input[0]);
    expect(c.next()).to.equal(input[0]);
    expect(c.next()).to.equal(input[0]);
  });
});
