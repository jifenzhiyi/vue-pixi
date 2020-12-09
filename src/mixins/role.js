import { mapState } from 'vuex';
import { END_POINT } from '@/config';
import storage from '@/utils/storage';
import { queryWarehouse, queryDimensionList, queryMarkerList, queryVariablesList } from '@/views/api.js';

export default {
  computed: {
    ...mapState(['warehouseId', 'warehouseIds', 'systemStatus']),
    statusMap() {
      return this.systemStatusMap.find((o) => o.value === this.systemStatus);
    },
    factoryMap() {
      console.log('factoryConfig', this.factoryConfig);
      return this.factoryConfig;
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
      let isFirst = true;
      const getToken = encodeURIComponent(storage.get('scada_user_token'));
      this.ws = new WebSocket(
        `ws://${END_POINT.substring(7)}/api/realTimeMapData/${this.warehouseId}?accessToken=${getToken}`,
      );
      this.ws.onopen = () => {
        console.log('WS onopen', new Date().toLocaleTimeString());
        console.log('====================================');
      };
      this.ws.onclose = () => {
        console.log('WS onclose', new Date().toLocaleTimeString());
        console.log('====================================');
      };
      this.ws.onerror = () => {
        console.log('WS onerror', new Date().toLocaleTimeString());
        console.log('====================================');
      };
      this.ws.onmessage = (e) => {
        const jsonData = JSON.parse(e.data);
        jsonData.status != null && this.$store.commit('SET_SYSTEM_STATUS', jsonData.status);
        if (isFirst) {
          isFirst = false;
          this.application.init(jsonData).then((res) => {
            this.$store.commit('SET_FACTORY_CONFIG', res);
          });
        } else {
          this.application.update(jsonData).then((res) => {
            this.$store.commit('SET_FACTORY_CONFIG', res);
          });
        }
      };
    },
    updateInfo(info) {
      this.$store.commit('SET_FACTORY_CONFIG', info);
    },
    async queryWarehouse() {
      const res = await queryWarehouse();
      if (res) {
        res.data.rows.length > 0 && (this.warehouseInfo = res.data.rows[0]);
      }
      return res ? 'success' : 'error';
    },
    async queryDimensionList() {
      const res = await queryDimensionList({ parameter: 1 });
      return res ? 'success' : 'error';
    },
    async queryMarkerList() {
      const res = await queryMarkerList();
      // console.log('queryMarkerList res', res);
      res && res.data && res.data.rows.length > 0 && this.application.initMarkers(res.data.rows);
    },
    async queryVariablesList() {
      const res = await queryVariablesList();
      console.log('queryVariablesList res', res);
    },
    // 系统状态更新
    radioChange(e) {
      this.$store.commit('SET_SYSTEM_STATUS', e.target.value);
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
