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

export const updateSystemStatus = (data) => {
  const result = request.send('/api/superuserOperations/add/updateSystemStatus', { method: 'POST', data });
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

export const changeDirection = (data) => {
  const result = request.send('/api/superuserOperations/add/updateContainerDirection', { method: 'POST', data });
  return result;
};

export const restRobot = (data) => {
  const result = request.send('/api/superuserOperations/add/restartRobot', { method: 'POST', data });
  return result;
};
