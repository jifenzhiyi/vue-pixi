import { mapState } from 'vuex';
import { END_POINT } from '@/config';
import storage from '@/utils/storage';
import { queryWarehouse, queryDimensionList, queryVariablesList } from '@/views/api.js';

export default {
  computed: {
    ...mapState(['warehouseId', 'warehouseIds', 'systemStatus']),
    statusMap() {
      return this.systemStatusMap.find((o) => o.value === this.systemStatus);
    },
  },
  watch: {
    systemStatus() {
      console.log('系统状态更新为：', this.$t(this.statusMap.title));
    },
  },
  data() {
    return {
      username: storage.get('scada_user_name') || '未登录', // 管理员账号
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
    initWS() {
      const getToken = encodeURIComponent(storage.get('scada_user_token'));
      this.ws = new WebSocket(`ws://${END_POINT.substring(7)}/api/realTimeMapData/${this.warehouseId}?accessToken=${getToken}`);
      this.ws.onopen = (e) => {
        console.log('WS onopen ===', e);
      };
      this.ws.onclose = (e) => {
        console.log('WS onclose ===', e);
      };
      this.ws.onerror = (e) => {
        console.log('WS onerror ===', e);
      };
      this.ws.onmessage = (e) => {
        const jsonData = JSON.parse(e.data);
      };
    },
    async queryWarehouse() {
      const res = await queryWarehouse();
      console.log('queryWarehouse res', res);
    },
    async queryDimensionList() {
      const res = await queryDimensionList({ parameter: 1 });
      console.log('queryDimensionList res', res);
    },
    async queryVariablesList() {
      const res = await queryVariablesList();
      console.log('queryVariablesList res', res);
    },
    // 系统状态更新
    radioChange(e) {
      this.$store.commit('SET_SYSTEM_STATUS', e.target.value);
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
