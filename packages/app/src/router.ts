import { createRouter, createWebHistory } from 'vue-router';

import Archive from './views/Archive.vue';
import NotFound from './views/NotFound.vue';
import Home from './views/Home.vue';
import Live from './views/Live.vue';
import Comments from './views/COmments.vue';

export default createRouter({
  history: createWebHistory(),
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
      name: 'comments',
      path: `/lives/:liveId/comments`,
      component: Comments,
    },
    {
      path: `/archives`,
      redirect: () => ({
        name: 'home',
      }),
    },
    {
      name: 'archive',
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
