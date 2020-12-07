import Vue from 'vue';
import Vuex from 'vuex';
import storage from '@/utils/storage';
import { loadLanguageAsync } from '@/locale';
import localInit from './plugins/localInit';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    language: storage.get('scada_lang') || 'zh-CN',
    warehouseIds: storage.get('scada_warehouseIds') || [],
    menuList: storage.get('scada_menuList') || [],
  },
  mutations: {
    // 设置管理员权限
    SET_MENULIST(state, list) {
      state.menuList = list;
    },
    // 设置仓库列表
    SET_WAREHOUSEIDS(state, list) {
      state.warehouseIds = list;
    },
    // 设置语言
    SET_LANG(state, lang) {
      state.language = lang;
    },
  },
  actions: {
    SetLang({ commit }, lang) {
      return new Promise((resolve) => {
        commit('SET_LANG', lang);
        loadLanguageAsync(lang);
        resolve();
      });
    },
  },
  plugins: [localInit],
});
