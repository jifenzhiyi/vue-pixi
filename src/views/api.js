import request from '@/utils/request.js';

export const login = (data) => {
  const result = request.send('/api/users/login', { method: 'POST', data });
  return result;
};

export const queryWarehouse = () => {
  const result = request.send('/api/warehouseInfo/query', { method: 'POST' });
  return result;
};

export const queryDimensionList = (data) => {
  const result = request.send('/api/dimension/queryDimensionList', { method: 'POST', data });
  return result;
};

export const queryVariablesList = () => {
  const result = request.send('/api/variables/queryList', { method: 'POST' });
  return result;
};

export const queryMarkerList = () => {
  const result = request.send('/api/marker/queryList', { method: 'POST' });
  return result;
};

export const taskAdd = (url, data) => {
  const result = request.send(`/api/tasks/add${url}`, { method: 'POST', data });
  return result;
};

export const maxContainerId = () => {
  const result = request.send('/api/containers/queryMaxContainerId', { method: 'POST' });
  return result;
};

// 更新系统状态 updateSystemStatus
// 更新货架方向 updateContainerDirection
// 重启机器人 restartRobot
// 标记地面 markGround
export const operation = (data, url) => {
  const result = request.send(`/api/superuserOperations/add${url}`, { method: 'POST', data });
  return result;
};

export const queryUserSystemThemeInfo = () => {
  const result = request.send('/api/configUserSystemTheme/queryUserSystemThemeInfo', { method: 'POST' });
  return result;
};

export const queryTheme = (data) => {
  const result = request.send('/api/configSystemTheme/querySystemThemeByThemeId', { method: 'POST', data });
  return result;
};

// equipments/findAll
export const queryEquipments = () => {
  const result = request.send('/api/equipments/findAll', { method: 'POST' });
  return result;
};

// updateSystemParameter
export const updateSystemParameter = (data) => request.send('/api/superuserOperations/add/updateSystemParameter', { method: 'POST', data });
