import Pusher from 'pusher';

const [cluster, appId, key, secret] = process.env.SECRET_PUSHER_CONFIG.split(
  ':'
);

export default new Pusher({
  appId,
  key,
  secret,
  cluster,
  useTLS: true,
});
