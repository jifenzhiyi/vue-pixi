import storage from '@/utils/storage';

export default (store) => {
  if (localStorage) {
    // TOTO store初始化的时候，将存储在localStoreage中的数据还原
  }

  // 如果用户相关状态发生变化，自动存入localStoreage
  store.subscribe((mutation, state) => {
    mutation.type === 'SET_WAREHOUSE_ID' && storage.set('scada_warehouseId', state.warehouseId);
    mutation.type === 'SET_WAREHOUSEIDS' && storage.set('scada_warehouseIds', state.warehouseIds);
    mutation.type === 'SET_MENULIST' && storage.set('scada_menuList', state.menuList);
    mutation.type === 'SET_SYSTEM_STATUS' && storage.set('scada_system_status', state.systemStatus);
    mutation.type === 'SET_THEMES_ID' && storage.set('scada_themeId', state.themeId);
    mutation.type === 'SET_MODE_TYPE' && storage.set('scada_status', state.modeType);
  });
};
