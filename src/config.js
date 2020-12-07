export const NODE_ENV = process.env.NODE_ENV || 'dev';

const item = 'malu-superuser';
export const API_LIST = {
  dev: `http://192.168.188.11:9073/${item}`, // cdyq
  // dev: `http://192.168.188.16:9011/${item}`, // hy
  prod: `${window.location.origin}/${item}/`,
};

export const END_POINT = API_LIST[NODE_ENV];
