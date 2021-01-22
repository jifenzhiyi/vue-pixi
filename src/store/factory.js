import Vue from 'vue';
import storage from '@/utils/storage.js';
import { taskAdd, operation } from '@/views/api.js';

export default {
  state: {
    factoryConfig: {
      floorsCount: 0, // 楼层数量
      spaceCount: 0, // 点位数量
      spaceCountOfCharger: 0, // 充电桩数量
      containerCount: 0, // 货架数量
      robotCount: {
        sum: 0, // 总数
        'robotCountOf-1': 0, // 离线
        robotCountOf99: 0, // 有问题
        robotCountOf0: 0, // 空载
        robotCountOf1: 0, // 载货
        robotCountOf3: 0, // 充电
      }, // 机器人数量
      terminalCount: {
        sum: 0, // 总数
        terminalCountOf0: 0, // 离线
        terminalCountOf1: 0, // 工作
        terminalCountOf2: 0, // 暂停
      }, // 工作站数量
      robotMapOfError: {},
      terminalMap: {},
      robotMap: {},
      spaceMap: {},
      spaceMapOfMark: {},
      containerMap: {},
      chargerMap: {}, // 充电桩map
    },
    params: {
      floorDirection: storage.get('scada_params_floorDirection') || 'Horizontal', // Horizontal Vertical
      showSpaces: storage.get('scada_params_showSpaces') || false, // 展示space
      showLinks: storage.get('scada_params_showLinks') || false, // 展示通道
      showSpaceId: storage.get('scada_params_showSpaceId') || false, // 展示spaceId
      showContainersType: storage.get('scada_params_showContainersType') || 'frequence', // 货架显示方式 frequence热度 type类型
      showContainerBerth: storage.get('scada_params_showContainerBerth') || false, // 货架泊位
      showInvalidSpace: storage.get('scada_params_showInvalidSpace') || false, // 无效位
      showWaitingSpace: storage.get('scada_params_showWaitingSpace') || false, // 等待位
      showSafeSpace: storage.get('scada_params_showSafeSpace') || false, // 安全位
      showRobots: storage.get('scada_params_showRobots') || false, // 是否展示机器人
      showOfflineRobots: storage.get('scada_params_showOfflineRobots') || false, // 展示离线机器人
      showRobotsPath: storage.get('scada_params_showRobotsPath') || false, // 机器人路径
      showRobotsId: storage.get('scada_params_showRobotsId') || false, // 展示机器人Id
      RobotTimeout: storage.get('scada_params_RobotTimeout') || 60, // 默认60
      showRobotError: storage.get('scada_params_showRobotError') || false, // 是否现实报警
      ErrRobotTimeout: storage.get('scada_params_ErrRobotTimeout') || 10,
      moveSpeed: storage.get('scada_params_moveSpeed') || 1.5,
      showContainers: storage.get('scada_params_showContainers') || false, // 展示货架
      showContainerId: storage.get('scada_params_showContainerId') || false, // 展示货架编号
      showTerminals: storage.get('scada_params_showTerminals') || false, // 展示工作站
      showMarker: storage.get('scada_params_showMarker') || false, // 展示标记
      fullScreen: storage.get('scada_params_fullScreen') || false,
      showStats: storage.get('scada_params_showStats') || false,
      allowSound: false,
    },
    stats: null,
    // 鼠标移动中显示的space信息
    config: {
      posX: '-',
      posY: '-',
      posZ: '-',
      spaceId: '-',
      robotId: '-',
      robotErr: '',
      containerId: '-',
      terminalId: '-',
    },
    // 鼠标左键选中的space信息
    hoverSpaceInfo: {
      config: {
        url: null,
        object: null,
        spaceId: null,
        priority: null,
      },
    },
    // 鼠标右键选中的space信息
    toSpaceInfo: {},
    selectedContainers: [], // 批量编辑模式中选中的所有货架
  },
  mutations: {
    SET_STATS(state, stats) {
      state.stats = stats;
    },
    UPDATE_STATS(state, value) {
      value ? (state.stats.dom.style.display = 'block') : (state.stats.dom.style.display = 'none');
    },
    SET_SELECT_CONTAINERS(state, arr) {
      state.selectedContainers = arr;
    },
    SET_TO_SPACE_INFO(state, space) {
      state.toSpaceInfo = space;
    },
    SET_HOVER_SPACE_INFO(state, space) {
      state.hoverSpaceInfo = space;
    },
    SET_HOVER_SPACE_INFO_ONE(state, obj) {
      Vue.set(state.hoverSpaceInfo, obj.key, obj.value);
    },
    ADD_CONTAINER_CONFIG(state, config) {
      state.hoverSpaceInfo.config = config;
    },
    UPDATE_ADD_CONTAINER_CONFIG(state, obj) {
      state.hoverSpaceInfo.config[obj.key] = obj.value;
    },
    SET_MOVE_SPEED(state, speed) {
      state.moveSpeed = speed;
    },
    SET_FACTORY_CONFIG(state, obj) {
      state.factoryConfig = obj;
    },
    SET_PARAMS(state, { key, value }) {
      state.params[key] = value;
      storage.set(`scada_params_${key}`, state.params[key]);
    },
    SET_CONFIG_ALL(state, config) {
      state.config = config;
    },
    SET_CONFIG_ONE(state, { key, value }) {
      state.config[key] = value;
    },
    CONFIG_RESET(state) {
      Object.keys(state.config).forEach((key) => {
        key === 'robotErr' ? (state.config[key] = '') : (state.config[key] = '-');
      });
    },
  },
  actions: {
    async AddContainer({ state, commit }) {
      const obj = state.hoverSpaceInfo.config;
      obj.objectId = obj.object;
      const res = await taskAdd(obj.url, obj);
      res && commit('SET_HOVER_SPACE_INFO_ONE', { key: 'containerId', value: obj.object });
      return res;
    },
    async updateContainerOrit({ state }, parameter) {
      const obj = state.hoverSpaceInfo.config;
      obj.parameter = parameter;
      obj.objectId = obj.object;
      const res = await operation(obj, '/updateContainerDirection');
      return res;
    },
  },
};
