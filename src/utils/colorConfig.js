const def = true;
const obj = {
  floorBgColor: def ? 0xffffff : 0x000000, // 场景背景颜色
  spacesPathColor: def ? 0x000000 : 0xffffff, // 场景点位路径颜色
  hoverBorderColor: 0x0000ff, // 选中边框颜色
  fromBorderColor: 0xff0000, // 移动起始边框颜色
  toBorderColor: 0x00ff00, // 移动结束边框颜色
  spaceIdColor: '#ff0000', // 位置编号字体颜色
  robotlineColor: def ? 0x000000 : 0xff9900, // 机器人移动路线颜色
  markerBoxColor: {
    isT: {
      tint: def ? 0x000000 : 0x0000ff, // 底色
      fill: 0xffffff, // 字色
    }, // 工作站
    noT: {
      tint: def ? 0x000000 : 0x333333, // 底色
      fill: def ? 0xffffff : 0xeeeeee, // 字色
    }, // 非工作站
  },
  spaceColorMap: {
    '-1': 0xe75ee7, // 地面标红，status 为 1 时使用
    0: def ? 0xffffff : 0xaaaaaa, // type 普通space 0xffffff
    1: 0xe8eaf0, // type container slot
    2: def ? 0xffffff : 0xaaaaaa, // type 工作站-入库
    3: 0xd9f6ea, // type 等待位（浅绿色）
    4: def ? 0xffffff : 0xaaaaaa, // type 工作站-出库
    5: 0xffecc8, // type 等待位前通道（浅黄色）
    6: 0x1a1a31, // type 墙壁
    7: 0xffe35f, // type 充电桩
    8: 0xc66360, // type 工人位置
    9: 0xc7c3f0, // type 安全门（淄博）
    10: 0xbfd9ab, // type 电梯（eos立迅）
    11: 0xfba55e, // type 单点补货位（cjlr）
    20: 0x621c18,
    21: 0x621c18,
    30: 0x621c18,
  },
  terminalColorMap: {
    0: 0x6a6a6f, // 离线
    1: 0x36ab4a, // 运行
    2: 0xff596d, // 暂停
  },
  robotColorMap: {
    '-1': 0xd0d0d0, // 离线
    0: 0x959595, // 空闲
    1: 0x7fc1b1, // 载货
    3: 0x66a1e6, // 充电
    // 1: 0xffafaf,
    '>50': 0xe7693f,
  },
  errorTextStyle: {
    fontSize: 28,
    fontWeight: '900',
    fill: 0xffffff,
  },
  robotIdStyle: {
    fontSize: 20,
    fill: 0xff0000,
  },
  containerIdStyle: {
    fontSize: 14,
    fill: 0x000000,
  },
  containerIdStyle2: {
    fontSize: 14,
    fill: 0x8a3b0e,
  },
  containerIdStyle3: {
    fontSize: 8,
    wordWrap: true, // 是否换行
    fill: 0x000000,
  },
  markerTextStyle: {
    fontSize: 90,
    fontWeight: '900',
    fill: 0x000000,
  },
};

export default obj;
