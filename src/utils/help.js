let timeout = null;
export const debounce = (fn, wait) => {
  if (timeout !== null) clearTimeout(timeout);
  timeout = setTimeout(fn, wait);
};

export const thottle = (fn, delay) => {
  let last = 0;
  return (...args) => {
    const now = + Date.now();
    if (now > last + delay) {
      last = now;
      fn.apply(this, args);
    }
  };
};

export const getNewDate = (time) => time.replace('T', ' ');

export const convertArrayToMap = (array, key) => {
  const object = {};
  array.forEach((element) => {
    object[element[key]] = element;
  });
  return object;
};

export const promiseReject = (errorObj) => new Promise((resolve, reject) => reject(errorObj));

export const parseInt = (variable, hex = 10) => parseInt(variable, hex);

export const isEmptyObject = (object) => Object.keys(object).length === 0;

export const isEmptyArray = (array) => array.length === 0;

// 手机验证
const myreg1 = /^[1][0-9]{10}$/;
export const isPhoneAvailable = (mobile) => !myreg1.test(mobile);

// 邮箱验证
const myreg2 = /^[a-z0-9]+([._\\-]*[a-z0-9])*@([a-z0-9]+[-a-z0-9]*[a-z0-9]+.){1,63}[a-z0-9]+$/;
export const isEmailAvailable = (email) => !myreg2.test(email);

export const getDateNow = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = d.getMonth() + 1 < 10 ? `0${d.getMonth() + 1}` : d.getMonth() + 1;
  const day = d.getDate() < 10 ? `0${d.getDate()}` : d.getDate();
  return `${year}-${month}-${day}`;
};

const formatNumber = (n) => {
  n = n.toString();
  return n[1] ? n : `0${n}`;
};

export const formatDate = (date) => {
  date = new Date(date);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${[year, month, day].map(formatNumber).join('-')}`;
};

export const formatTime = (date) => {
  date = new Date(date);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();
  return `${[year, month, day].map(formatNumber).join('-')} ${[hour, minute, second].map(formatNumber).join(':')}`;
};

export const getCurrentMonthLast = (date) => {
  const endDate = new Date(date); // date 是需要传递的时间如：2018-08
  const month = endDate.getMonth();
  const nextMonth = month + 1;
  const nextMonthFirstDay = new Date(endDate.getFullYear(), nextMonth, 1);
  const oneDay = 1000 * 60 * 60 * 24;
  const dateString = new Date(nextMonthFirstDay - oneDay);
  return formatDate(dateString);
};

export function base64ToBlob(urlData, type) {
  const arr = urlData.split(',');
  const mime = arr[0].match(/:(.*?);/)[1] || type;
  // 去掉url的头，并转化为byte
  const bytes = window.atob(arr[1]);
  // 处理异常,将ascii码小于0的转换为大于0
  const ab = new ArrayBuffer(bytes.length);
  // 生成视图（直接针对内存）：8位无符号整数，长度1个字节
  const ia = new Uint8Array(ab);
  for (let i = 0; i < bytes.length; i++) {
    ia[i] = bytes.charCodeAt(i);
  }
  return new Blob([ab], { type: mime });
}
