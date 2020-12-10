import request from '@/utils/request';

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
