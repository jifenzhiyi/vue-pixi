import Vue from 'vue';
import Vuex from 'vuex';
import storage from '@/utils/storage.js';
import colorConfig from '@/utils/colorConfig.js';
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
    // 系统模式modeStatus 默认view 编辑edit 标记地面mark 批量编辑batch
    modeStatus: 'view',
    modeType: storage.get('scada_status') || '2D', // 系统类型 2D 3D
    popShowConfigure: false, // 设置弹窗
    popShowAddContainer: false, // 新增货架弹窗
    popShowUpdateContainerOrit: false, // 更新货架方向弹窗
    application: null, // 全局保存工程 pixi
    game: null, // 全局3D工程 three
    themes: [{ value: 0, label: '默认' }], // 模版列表
    themeId: storage.get('scada_themeId') || 0, // 当前选中的模版Id
    colorConfig,
  },
  mutations: {
    SET_COLOR_CONFIG(state, config) {
      state.colorConfig = config;
    },
    SET_THEMES_ID(state, themeId) {
      state.themeId = themeId;
    },
    SET_THEMES(state, themes) {
      state.themes = themes;
      if (!state.themeId) {
        state.themeId = themes[0].value;
        storage.set('scada_themeId', state.themeId);
      }
    },
    SET_MODE_TYPE(state, type) {
      state.modeType = type;
    },
    // 设置系统模式
    SET_MODE(state, status) {
      state.modeStatus = status;
      state.application && state.application.updateModel();
      state.game && state.game.updateModel();
    },
    // 设置工程
    SET_APPLICATION(state, app) {
      state.application = app;
    },
    SET_GAME(state, app) {
      state.game = app;
    },
    // 删除工程
    DESTROY_APPLICATION(state) {
      state.application && state.application.destroy();
      state.application = null;
    },
    DESTROY_GAME(state) {
      state.game && state.game.destroy();
      state.game = null;
    },
    SET_CONTAINER_ORIT(state) {
      state.popShowUpdateContainerOrit = !state.popShowUpdateContainerOrit;
    },
    // 货架弹窗是否显示
    SET_ADD_CONTAINER(state) {
      state.popShowAddContainer = !state.popShowAddContainer;
    },
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
