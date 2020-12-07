import request from '@/utils/request';

// 登录
export const login = (data) => request.send('/api/users/login', { method: 'POST', data }, { isLoading: true });

// 权限控制接口
export const queryRoleMenu = () => request.send('/api/users/queryWarehouseRoleMenu', { method: 'POST' });
