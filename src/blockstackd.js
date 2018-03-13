import winston from 'winston';
import { exec } from 'child_process';
import { parseZoneFile } from 'zone-file';

import Circular from './circular';
import { decode } from './base64';
import config from './config';

export const errors = {
  NO_INFO: { error: 'No Info' },
  NO_ZONEFILE_HASH: { error: 'No Zonefile Hash' },
  NO_ZONEFILE: { error: 'No Zonefile' },
  MALFORMED_ZONEFILE: { error: 'Zonefile is malformed.' },
  NO_USER_RECORDS: { error: 'Cannot find user records.' },
};

const CORE_PATHS = Circular.from(config.get('blockstack:corePaths'));

// This means you need to have the blockstackd-cli (go cli built by Jack)
// available on your path.
const runCommand = (...cmd) => {
  const builtCmd = `blockstackd-cli -n ${CORE_PATHS.next()} ${cmd.join(' ')}`;

  return new Promise((resolve) => {
    exec(builtCmd, (err, stdout) => {
      if (err) {
        winston.log('error', `exec error: ${err}`);
        return;
      }

      try {
        const result = JSON.parse(stdout.trim());
        resolve(result);
      } catch (e) {
        winston.log('error', e);
        resolve({ error: 'Failed to run command. Check the logs for more detail.' });
      }
    });
  });
};

const getNumNamesInNamespace = ns => runCommand('get_num_names_in_namespace', ns);

const getNamesInNamespace = (ns, offset, count) => runCommand('get_names_in_namespace', ns, offset, count);

const getInfo = () => runCommand('getinfo');

const getNameAt = (name, blockHeight) => runCommand('get_name_at', name, blockHeight);

const getZonefileFromHash = hash => runCommand('get_zonefiles', hash);

const getZonefile = async (name) => {
  const info = await getInfo();
  if (!info.last_block_processed) {
    return Promise.resolve(errors.NO_INFO);
  }
  const nameInfo = await getNameAt(name, info.last_block_processed);

  if (!nameInfo.records) {
    return Promise.resolve(errors.NO_USER_RECORDS);
  }
  const hash = nameInfo.records[0].value_hash;

  if (!hash) {
    return Promise.resolve(errors.NO_ZONEFILE_HASH);
  }
  const encZonefile = await getZonefileFromHash(hash);

  if (!encZonefile.zonefiles || !encZonefile.zonefiles[hash]) {
    return Promise.resolve(errors.NO_ZONEFILE);
  }
  const txtZonefile = decode(encZonefile.zonefiles[hash]);

  const jsonZonefile = parseZoneFile(txtZonefile);
  if (Object.keys(jsonZonefile).length === 0) {
    return errors.MALFORMED_ZONEFILE;
  }

  return jsonZonefile;
};

const isSubdomain = (zonefile) => {
  if (zonefile.txt && zonefile.txt.filter((record) => record.txt.indexOf('zf0=') === 0).length > 0 ) {
    return true;
  }
  return false;
};

export default {
  getInfo,
  getZonefileFromHash,
  getZonefile,
  getNameAt,
  getNumNamesInNamespace,
  getNamesInNamespace,
  isSubdomain,
  errors,
};
