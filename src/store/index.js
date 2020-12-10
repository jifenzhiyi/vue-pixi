import Vue from 'vue';
import Vuex from 'vuex';
import storage from '@/utils/storage.js';
import { loadLanguageAsync } from '@/locale/index.js';
import localInit from './plugins/localInit.js';
import factory from './factory.js';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    language: storage.get('scada_lang') || 'zh-CN',
    warehouseId: storage.get('scada_warehouseId') || '', // 选中的仓库
    warehouseIds: storage.get('scada_warehouseIds') || [], // 仓库列表
    menuList: storage.get('scada_menuList') || [],
    systemStatus: storage.get('scada_system_status') || 0, // 系统状态
    popShowConfigure: false,
  },
  mutations: {
    // 设置弹出层是否显示
    SET_CONFIGURE_SHOW(state) {
      state.popShowConfigure = !state.popShowConfigure;
    },
    // 设置系统状态
    SET_SYSTEM_STATUS(state, status) {
      state.systemStatus = status;
    },
    // 设置管理员权限
    SET_MENULIST(state, list) {
      state.menuList = list;
    },
    // 选中仓库
    SET_WAREHOUSE_ID(state, id) {
      state.warehouseId = id;
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
  modules: { factory },
});
