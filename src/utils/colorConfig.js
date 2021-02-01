const obj = {
  floorBgColor: 0xffffff, // 场景背景颜色
  spacesPathColor: 0x000000, // 场景点位路径颜色
  hoverBorderColor: 0x0000ff, // 选中边框颜色
  fromBorderColor: 0xff0000, // 移动起始边框颜色
  toBorderColor: 0x00ff00, // 移动结束边框颜色
  spaceIdColor: '#ff0000', // 位置编号字体颜色
  robotlineColor: 0x000000, // 机器人移动路线颜色
  markerBoxColor: {
    isT: {
      tint: 0x000000, // 底色
      fill: 0xffffff, // 字色
    }, // 工作站
    noT: {
      tint: 0x000000, // 底色
      fill: 0xffffff, // 字色
    }, // 非工作站
  },
  spaceColorMap: {
    '-1': 0xE75EE7, // 地面标红，status 为 1 时使用
    0: 0xffffff, // type 普通space 0xffffff
    1: 0xE8EAF0, // type container slot
    2: 0xffffff, // type 工作站-入库
    3: 0xD9F6EA, // type 等待位（浅绿色）
    4: 0xffffff, // type 工作站-出库
    5: 0xFFECC8, // type 等待位前通道（浅黄色）
    6: 0x1A1A31, // type 墙壁
    7: 0xFFE35F, // type 充电桩
    8: 0xc66360, // type 工人位置
    9: 0xC7C3F0, // type 安全门（淄博）
    10: 0xBFD9AB, // type 电梯（eos立迅）
    11: 0xFBA55E, // type 单点补货位（cjlr）
    20: 0x621C18,
    21: 0x621C18,
    30: 0x621C18,
  },
  terminalColorMap: {
    0: 0x6A6A6F, // 离线
    1: 0x36AB4A, // 运行
    2: 0xFF596D, // 暂停
  },
  robotColorMap: {
    '-1': 0xD0D0D0, // 离线
    0: 0x959595, // 空闲
    1: 0x7fc1b1, // 载货
    3: 0x66A1E6, // 充电
    11: 0xFFAFAF,
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
    fontSize: 10,
    fill: 0x000000,
  },
  containerIdStyle2: {
    fontSize: 14,
    fill: 0x8A3B0E,
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
