import { describe, it } from 'mocha';
import { expect } from 'chai';

import { encode, decode } from '../src/base64';

describe('Base64 converter', () => {
  it('should encode base64 strings', () => {
    expect(encode('foobar\n')).to.equal('Zm9vYmFyCg==');
  });
  it('should decode base64 strings', () => {
    expect(decode('Zm9vYmFyCg==')).to.equal('foobar\n');
  });
});
