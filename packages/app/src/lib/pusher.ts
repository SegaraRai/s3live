import Pusher from 'pusher-js';

export default new Pusher(import.meta.env.VITE_PUSHER_APP_KEY, {
  cluster: import.meta.env.VITE_PUSHER_CLUSTER,
});
