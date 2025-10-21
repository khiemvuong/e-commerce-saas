import ImageKit from '@imagekit/nodejs';

export const client = new ImageKit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
});
