// import { mapState } from 'vuex';
import storage from '@/utils/storage';

export default {
  data() {
    return {
      username: storage.get('scada_user_name') || '未登录', // 管理员账号
      warehouseId: storage.get('scada_warehouseId') || [], // 仓库列表
    };
  },
};
