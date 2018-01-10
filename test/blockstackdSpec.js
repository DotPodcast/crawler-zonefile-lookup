import { describe, it } from 'mocha';
import { expect } from 'chai';

import blockstackd from '../src/blockstackd';

describe('The blockstackd proxy', function () {
  this.timeout(5000);

  it('should properly get info about the core node', () => {
    return blockstackd.getInfo().then((info) => {
      expect(info.server_alive).to.be.true;
    });
  });

  it('should properly get info about a given name', () => {
    return blockstackd.getNameAt('freethejazz.id', 502898).then((nameInfo) => {
      expect(nameInfo.records[0].name).to.equal('freethejazz.id');
      expect(nameInfo.records[0].value_hash).to.equal('3f9dc8ddcfe6212665b8d615795482ef1536354d');
    });
  });

  it('should get an encoded zonefile given a hash', () => {
    return blockstackd.getZonefileFromHash('3f9dc8ddcfe6212665b8d615795482ef1536354d').then((encZonefile) => {
      expect(encZonefile.status).to.be.true;
      expect(encZonefile.zonefiles).to.have.all.keys('3f9dc8ddcfe6212665b8d615795482ef1536354d');
    });
  });

  it('should get the json version of a zonefile given a name', () => {
    return blockstackd.getZonefile('freethejazz.id').then((zonefile) => {
      expect(zonefile).to.have.all.keys('$origin', '$ttl', 'uri');
      expect(zonefile.$origin).to.equal('freethejazz.id');
      expect(zonefile.$ttl).to.equal(3600);
    });
  });
});
