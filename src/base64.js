export const decode = input => Buffer.from(input, 'base64').toString('ascii');

export const encode = input => Buffer.from(input).toString('base64');

export default {
  encode,
  decode,
};
