import VueRouter from 'vue-router';

import Archive from './views/Archive.vue';
import NotFound from './views/NotFound.vue';
import Home from './views/Home.vue';
import Live from './views/Live.vue';

export default new VueRouter({
  mode: 'history',
  routes: [
    {
      name: 'home',
      path: '/',
      component: Home,
    },
    {
      path: `/lives`,
      redirect: () => ({
        name: 'home',
      }),
    },
    {
      name: 'live',
      path: `/lives/:liveId`,
      component: Live,
    },
    {
      path: `/archives`,
      redirect: () => ({
        name: 'home',
      }),
    },
    {
      name: 'live',
      path: `/archives/:liveIdAndHash`,
      component: Archive,
    },
    {
      name: 'notFound',
      path: '/:paths(.*)*',
      component: NotFound,
    },
  ],
});
