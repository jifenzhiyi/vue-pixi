export const NODE_ENV = process.env.NODE_ENV || 'dev';

const item = 'malu-superuser';
export const API_LIST = {
  // dev: `http://192.168.188.11:9073/${item}`, // cdyq测试
  // dev: `http://192.168.188.16:9011/${item}`, // hy测试
  // dev: `http://192.168.188.16:9251/${item}`, // ykk
  // dev: `http://192.168.188.11:9101/${item}`, // zb测试
  // dev: `http://192.168.188.16:9031/${item}`, // 读库测试
  dev: `http://192.168.188.11:9141/${item}`, // 岩峰
  prod: `${window.location.origin}/${item}/`,
};

export const END_POINT = API_LIST[NODE_ENV];
