import Vue from 'vue';
import App from './App.vue';
import i18n from './locale/index.js';
import store from './store/index.js';
import router from './router/index.js';
import config from '../package.json';
import storage from './utils/storage.js';
import { isPC } from './utils/device.js';
import createComp from './utils/create.js';
import './styles/main.less';
import './styles/pop.less';
import './utils/antd.js';
import './icons/index.js';

Vue.config.productionTip = false;
Vue.prototype.$storage = storage;
Vue.prototype.$version = config.version;
Vue.prototype.$isPC = isPC;
Vue.use(createComp);
console.info(`%cv${config.version} (${new Date().toLocaleString()})`, 'color: red');

new Vue({
  i18n,
  store,
  router,
  render: (h) => h(App),
}).$mount('#app');
