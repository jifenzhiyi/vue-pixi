import storage from '@/utils/storage';

export default {
  state: {
    params: {
      floorDirection: storage.get('scada_floor_direction') || 'column', // row column
      moveSpeed: storage.get('scada_move_speed') || 1.5,
    },
  },
  mutations: {
    SET_PARAMS(state, { key, value }) {
      state.params[key] = value;
    },
  },
};
