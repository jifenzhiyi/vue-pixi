import request from '@/utils/request';

// 登录
export const login = (data) => request.send('/api/users/login', { method: 'POST', data }, { isLoading: true });

// 获取仓库信息
export const queryWarehouse = () => request.send('/api/warehouseInfo/query', { method: 'POST' });

export const queryDimensionList = (data) => request.send('/api/dimension/queryDimensionList', { method: 'POST', data });

export const queryVariablesList = () => request.send('/api/variables/queryList', { method: 'POST' });
