import { Novu } from '@novu/api';

const novu = new Novu({
  secretKey: process.env.NOVU_SECRET_KEY,
});

export default novu;
