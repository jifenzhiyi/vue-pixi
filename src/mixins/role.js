import { mapState } from 'vuex';
import storage from '@/utils/storage';

export default {
  computed: {
    ...mapState(['warehouseId', 'warehouseIds']),
  },
  watch: {
    systemStatus() {
      console.log('页面初始化');
    },
  },
  data() {
    return {
      username: storage.get('scada_user_name') || '未登录', // 管理员账号
      systemStatus: storage.get('scada_system_status') || 0,
      state: {
        posX: '-',
        posY: '-',
        posZ: '-',
        spaceId: '-',
        robotId: '-',
        robotErr: '',
        containerId: '-',
        terminalId: '-',
        model: 'view', // 当前模式 'view', 'mark', 'edit', 'batch'
      },
      systemStatusMap: [
        { title: 'Starting', value: 3 },
        { title: 'Locking', value: 1 },
        { title: 'Pausing', value: 0 },
        { title: 'Charging', value: 2 },
      ],
    };
  },
  methods: {
    // 系统状态更新
    radioChange(e) {
      this.systemStatus = e.target.value;
      storage.set('scada_system_status', e.target.value);
    },
    // 重置
    reset() {
      Object.keys(this.state).forEach((key) => {
        if (key === 'model') {
          this.state.model = 'view';
        } else {
          key === 'robotErr' ? this.state[key] = '' : this.state[key] = '-';
        }
      });
    },
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
