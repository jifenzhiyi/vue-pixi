import Vue from 'vue';
import VueRouter from 'vue-router';
import storage from '@/utils/storage';
import Scada from '@/views/Scada.vue';
import Login from '@/views/Login';
import notFound from 'comps/404';

Vue.use(VueRouter);

const routes = [
  { path: '/', redirect: '/login' },
  {
    path: '/scada', name: 'Scada', component: Scada, meta: { requiresAuth: true },
  },
  { path: '/login', name: 'login', component: Login },
  { path: '*', name: 'notFound', component: notFound },
];

const router = new VueRouter({ mode: 'history', routes });
// 导航守卫
router.beforeEach((to, from, next) => {
  const requiresAuth = to.meta && (to.meta.requiresAuth || false);
  const userToken = storage.get('scada_user_token');
  const needLogin = requiresAuth && !userToken;
  if (needLogin) {
    next({ path: '/login' });
    return;
  }
  next();
});

window.router = router;

export default router;
