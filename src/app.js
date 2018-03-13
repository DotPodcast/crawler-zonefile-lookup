import winston from 'winston';
import amqplib from 'amqplib';

import config from './config';
import blockstackd from './blockstackd';

winston.log('info', 'Up');
winston.log('info', config.get('rabbit'));
winston.log('info', config.get('blockstack'));

const exit = (cb) => {
  try {
    if (cb) {
      cb();
    }
  } catch (err) {
    winston.log('error', 'Could not run cleanup fn');
    winston.log('error', err);
  } finally {
    process.exit(0);
  }
};

const inQ = config.get('rabbit:inQueue');
const outQ = config.get('rabbit:outQueue');
const subdomainQ = config.get('rabbit:subdomainQueue');
const persistQ = config.get('rabbit:persistQueue');

// Connect to RabbitMQ
const open = amqplib.connect(`amqp://${config.get('rabbit:host')}`);

open.then((conn) => {
  conn.createChannel()
    .then((ch) => {
      ch.prefetch(1);
      ch.assertQueue(inQ, { durable: true, maxLength: 40000});
      winston.log('info', 'Input Queue is Present');

      ch.assertQueue(outQ, { durable: true });
      winston.log('info', 'Output Queue is Present');

      ch.assertQueue(subdomainQ, { durable: true });
      winston.log('info', 'Subdomain Queue is Present');

      ch.assertQueue(persistQ, { durable: true });
      winston.log('info', 'Persist Queue is Present');

      const work = async (doc, channel, msg) => {
        const zonefile = await blockstackd.getZonefile(doc.name);
        if (!zonefile.error) {
          if(blockstackd.isSubdomain(zonefile)) {
            winston.info(`Subdomain detected for ${zonefile.$origin}`);
            channel.sendToQueue(subdomainQ, Buffer.from(JSON.stringify(zonefile)), { persistent: true });
          } else {
            winston.info(`Found zonefile for ${zonefile.$origin}`);
            if (zonefile.uri) {
              const httpUri = zonefile.uri.filter((uri) => uri.name === '_http._tcp');
              if (!httpUri.length) {
                winston.info(`No http uri found for ${zonefile.$origin}`);
              } else {
                // Send to the crawl queue
                channel.sendToQueue(outQ, Buffer.from(JSON.stringify({
                  uri: httpUri[0].target,
                  mergeData: {
                    docId: zonefile.$origin,
                  },
                })), { persistent: true });
              }
            }
            // Persist the zonefile as is
            channel.sendToQueue(persistQ, Buffer.from(JSON.stringify({
              index: 'zonefiles',
              type: 'zonefile',
              id: zonefile.$origin,
              source: zonefile
            })), { persistent: true });

          }
          channel.ack(msg);
        } else if (blockstackd.errors.NO_INFO === zonefile) {
          winston.error(`Could not get basic core info when processing ${doc.name}. Requeuing...`);
          channel.nack(msg);
        } else {
          winston.error(`Could not get zonefile for ${doc.name}. ${zonefile.error}`);
          channel.nack(msg, undefined, false);
        }
      };

      ch.consume(inQ, (msg) => {
        let doc;
        try {
          doc = JSON.parse(msg.content.toString());
        } catch (e) {
          winston.log('error', e);
          return winston.log('error', 'Could not parse message into JSON');
        }
        return work(doc, ch, msg);
      }, { noAck: false });
    });
});

open.catch((err) => {
  winston.log('warn', `Error connecting to rabbit at ${config.get('rabbit_host')}`);
  winston.log('error', err);
  exit();
});

process.on('SIGINT', () => {
  winston.log('info', '\nGracefully shutting down from SIGINT (Ctrl-C)');
  exit();
});
