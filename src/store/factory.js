import storage from '@/utils/storage';

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
    },
    params: {
      floorDirection: storage.get('scada_floorDirection') || 'Horizontal', // Horizontal Vertical
      showSpaces: storage.get('scada_showSpaces') || false, // 展示space
      showLinks: storage.get('scada_showLinks') || false, // 展示通道
      showSpaceId: storage.get('scada_showSpaceId') || false, // 展示spaceId
      showContainersType: storage.get('scada_showContainersType') || 'frequence', // 货架显示方式 frequence热度 type类型
      showContainerBerth: storage.get('scada_showContainerBerth') || false, // 货架泊位
      showInvalidSpace: storage.get('scada_showInvalidSpace') || false, // 无效位
      showWaitingSpace: storage.get('scada_showWaitingSpace') || false, // 等待位
      // showSafeSpace: storage.get('scada_showSafeSpace') || false, // 安全位
      showRobots: storage.get('scada_showRobots') || false, // 是否展示机器人
      showOfflineRobots: storage.get('scada_showOfflineRobots') || false, // 展示离线机器人
      // showRobotsPath: storage.get('scada_showRobotsPath') || false, // 机器人路径
      showRobotsId: storage.get('scada_showRobotsId') || false, // 展示机器人Id
      ErrRobotTimeout: storage.get('scada_ErrRobotTimeout') || 10,
      RobotTimeout: storage.get('scada_RobotTimeout') || 60, // 默认60
      moveSpeed: storage.get('scada_moveSpeed') || 1.5,
      fullScreen: storage.get('scada_fullScreen') || false,
      allowSound: false,
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
