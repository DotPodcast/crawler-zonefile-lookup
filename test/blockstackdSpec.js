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

  it('should properly identify a zonefile that contains subdomains', () => {
    const regZonefile = {
      '$origin': 'foo.id',
      '$ttl': 3600,
      uri: [
        {
          name: '_http._tcp',
          target: 'http://mysub/foo.id',
          priority: 10,
          weight: 1
        }
      ]
    };

    const subZonefile = {
      '$origin': 'bar.id',
      '$ttl': 3600,
      txt: [
        {
          name: 'pubkey',
          txt: 'pubkey:data:0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
        },
        {
          name: 'aaron',
          txt: 'zf0=JE9SSUdJTiBhYXJvbgokVFRMIDM2MDAKbWFpbiBVUkkgMSAxICJwdWJrZXk6ZGF0YTowMzAyYWRlNTdlNjNiMzc1NDRmOGQ5Nzk4NjJhNDlkMDBkYmNlMDdmMjkzYmJlYjJhZWNmZTI5OTkxYTg3Mzk4YjgiCg=='
        }
      ],
      uri: [
        {
          name: 'registrar',
          target: 'bsreg://foo.com:8234',
          priority: 10,
          weight: 1
        }
      ]
    };

    expect(blockstackd.isSubdomain(regZonefile)).to.be.false;
    expect(blockstackd.isSubdomain(subZonefile)).to.be.true;

  });
});
