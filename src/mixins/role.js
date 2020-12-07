import { mapState } from 'vuex';
import storage from '@/utils/storage';

export default {
  computed: mapState(['warehouseId', 'warehouseIds']),
  data() {
    return {
      username: storage.get('scada_user_name') || '未登录', // 管理员账号
    };
  },
  methods: {
    // 更新仓库id
    warehouseChange(val) {
      this.$store.commit('SET_WAREHOUSE_ID', val);
    },
    // 退出登录
    logout() {
      this.$notice_confirm({
        minfo: '是否确认退出？',
        func: () => {
          storage.clear();
          this.$router.push('/login');
        },
      });
    },
  },
};
