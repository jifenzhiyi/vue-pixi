import { mapState } from 'vuex';
import { END_POINT } from '@/config';
import storage from '@/utils/storage';
import colorConfig from '@/utils/colorConfig.js';
import {
  queryWarehouse,
  queryDimensionList,
  queryMarkerList,
  queryVariablesList,
  operation,
  queryUserSystemThemeInfo,
  queryTheme,
} from '@/views/api.js';

export default {
  computed: {
    ...mapState(['warehouseId', 'warehouseIds', 'systemStatus', 'menuList', 'themeId']),
    statusMap() {
      return this.systemStatusMap.find((o) => o.value === this.systemStatus);
    },
    factoryMap() {
      return this.factoryConfig;
    },
    buttonTypeList() {
      const obj = {};
      this.menuList.forEach((item) => {
        obj[item.buttonType] = item.url;
      });
      return obj;
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
      colorConfig,
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
        jsonData.status != null && this.$store.commit('SET_SYSTEM_STATUS', Number(jsonData.status));
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
      res && res.data.rows.length > 0 && (this.warehouseInfo = res.data.rows[0]);
      return res ? 'success' : 'error';
    },
    async queryDimensionList() {
      const res = await queryDimensionList({ parameter: 1 });
      if (res && res.data && res.data.length > 0) {
        const containerTypeMap = {};
        res.data.forEach((item) => {
          item.width *= 10;
          item.length *= 10;
          item.height *= 10;
          containerTypeMap[item.type] = item;
        });
        this.application.updateContainersType(containerTypeMap);
      }
    },
    async queryMarkerList() {
      const res = await queryMarkerList();
      res && res.data && res.data.rows.length > 0 && this.application.initMarkers(res.data.rows);
    },
    async queryVariablesList() {
      let res = 'success';
      if (this.buttonTypeList.variables) {
        const result = await queryVariablesList();
        res = result ? 'success' : 'error';
      }
      return res;
    },
    async configSystemTheme() {
      let res = 'success';
      if (this.buttonTypeList.theme) {
        const result = await queryUserSystemThemeInfo();
        if (result) {
          this.$store.commit(
            'SET_THEMES',
            result.data.themes.map((item) => ({
              value: item.themeId,
              label: item.themeName,
            })),
          );
          this.queryByThemeId();
        }
        res = result ? 'success' : 'error';
      }
      return res;
    },
    async queryByThemeId() {
      const res = await queryTheme({ themeId: this.themeId });
      if (res) {
        res.data.themes.forEach((one) => {
          if (one.themeType === 'markerBoxColor') {
            const varKey = one.themeStatus.split('_');
            this.colorConfig[one.themeType][varKey[0]][varKey[1]] = one.color;
          } else if (
            one.themeType === 'spaceColorMap' ||
            one.themeType === 'terminalColorMap' ||
            one.themeType === 'robotColorMap'
          ) {
            this.colorConfig[one.themeType][one.themeStatus] = one.color;
          } else if (
            one.themeType === 'errorTextStyle' ||
            one.themeType === 'robotIdStyle' ||
            one.themeType === 'containerIdStyle' ||
            one.themeType === 'containerIdStyle2' ||
            one.themeType === 'containerIdStyle3' ||
            one.themeType === 'markerTextStyle'
          ) {
            this.colorConfig[one.themeType][one.themeStatus] = one.color;
          } else {
            this.colorConfig[one.themeType] = one.color;
          }
        });
        this.$store.commit('SET_COLOR_CONFIG', this.colorConfig);
      }
    },
    // 系统状态更新
    async radioChange(e) {
      this.$store.commit('SET_SYSTEM_STATUS', e.target.value);
      const data = { code: 7, parameter: e.target.value, objectId: 'System' };
      await operation(data, '/updateSystemStatus');
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
