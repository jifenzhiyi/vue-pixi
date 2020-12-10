import storage from '@/utils/storage';

export default {
  state: {
    factoryConfig: {
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
    },
    params: {
      floorDirection: storage.get('scada_floor_direction') || 'column', // row column
      moveSpeed: storage.get('scada_move_speed') || 1.5,
      showOfflineRobots: storage.get('showOfflineRobots') || false, // 展示离线机器人
      showSpaceId: storage.get('showSpaceId') || false, // 展示spaceId
      showLinks: storage.get('showLinks') || true, // 展示通道
      showContainersType: storage.get('showContainersType') || 'frequence', // 货架显示方式 frequence热度 type类型
      ErrRobotTimeout: storage.get('ErrRobotTimeout') || 10,
      RobotTimeout: storage.get('RobotTimeout') || 60, // 默认60
      allowSound: false,
      fullScreen: storage.get('fullScreen') || false,
    },
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
  },
  mutations: {
    SET_FACTORY_CONFIG(state, obj) {
      state.factoryConfig = obj;
    },
    SET_PARAMS(state, { key, value }) {
      state.params[key] = value;
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
};
