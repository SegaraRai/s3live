import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './assets/main.css';
import { fetchUserId } from './lib/userAccount';

createApp(App).use(router).mount('#app');

fetchUserId();
