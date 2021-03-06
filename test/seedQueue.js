import winston from 'winston';
import amqplib from 'amqplib';

import config from '../src/config';

import names from './fixtures/names.json';

winston.log('info', 'Up');
winston.log('info', config.get('rabbit'));

const inQ = config.get('rabbit:inQueue');

// Connect to RabbitMQ
const open = amqplib.connect(`amqp://${config.get('rabbit:host')}`);

open.then((conn) => {
  conn.createChannel()
    .then((ch) => {
      ch.assertQueue(inQ, { durable: true });
      winston.log('info', 'Input Queue is Present');

      names.forEach((name) => {
        ch.sendToQueue(inQ, Buffer.from(JSON.stringify(name)), { persistent: true });
      });

      setTimeout(() => process.exit(), 2000);
    });
});
