import request from '@/utils/request';

export const login = (data) => request.send('/api/users/login', { method: 'POST', data }, { isLoading: true });

export const queryWarehouse = () => request.send('/api/warehouseInfo/query', { method: 'POST' });

export const queryDimensionList = (data) => request.send('/api/dimension/queryDimensionList', { method: 'POST', data });

export const queryVariablesList = () => request.send('/api/variables/queryList', { method: 'POST' });

export const queryMarkerList = () => request.send('/api/marker/queryList', { method: 'POST' });
