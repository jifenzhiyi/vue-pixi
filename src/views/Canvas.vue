<template>
  <div class="main">
    <div class="box">
      <div class="abs middle">
        <a-spin
          tip="Loading..."
          :spinning="loading" />
      </div>
      <canvas ref="gameView"></canvas>
    </div>
    <div
      ref="spaceInfo"
      class="space-info">
      <p class="posX">posX: <strong>{{ config.posX }}</strong></p>
      <p class="posY">posY: <strong>{{ config.posY }}</strong></p>
      <p class="posZ">posZ: <strong>{{ config.posZ }}</strong></p>
      <p class="spaceId">spaceId: <strong>{{ config.spaceId }}</strong></p>
      <p class="robotId">robotId: <strong>{{ config.robotId }}<span v-html="config.robotErr"/></strong></p>
      <p class="containerId">containerId: <strong>{{ config.containerId }}</strong></p>
      <p class="terminalId">terminalId: <strong>{{ config.terminalId }}</strong></p>
    </div>
    <div class="abs top">
      <div class="time">{{ formatTime }}</div>
      <div :class="['status', `s${systemStatus}`]">{{ $t(statusMap.title) }}</div>
    </div>
    <div class="abs bottom">
      <a-button-group>
        <a-button
          icon="menu"
          v-if="noMobile"
          @click="popHide"></a-button>
        <a-button
          icon="audio"
          v-if="noMobile"
          class="btnCss"
          @click="allowSound">
          <span
            v-show="!params.allowSound"
            class="abs audioCss">\</span>
        </a-button>
        <a-button
          icon="sync"
          @click="refresh"></a-button>
        <a-button
          icon="camera"
          @click="screenshot"></a-button>
      </a-button-group>
      <div
        v-if="noMobile"
        class="btn-center">
        <a-button
          class="btn"
          v-if="modeStatus === 'view'"
          @click="modeChange('edit')">{{$t('EditMode')}}</a-button>
        <a-button
          class="btn"
          v-if="modeStatus === 'view'"
          @click="modeChange('mark')">{{$t('SpaceMode')}}</a-button>
        <a-button
          class="btn"
          v-if="modeStatus === 'view'"
          @click="modeChange('batch')">{{$t('editContainers')}}</a-button>
        <a-button
          class="btn"
          v-if="modeStatus === 'edit' || modeStatus === 'batch'"
          @click="modeChange('view')">{{$t('ExitEditMode')}}</a-button>
        <a-button
          class="btn"
          v-if="modeStatus === 'mark'"
          @click="modeChange('view')">{{$t('ExitSpaceMode')}}</a-button>
      </div>
      <a-button-group>
        <a-button
          icon="zoom-out"
          @click="zoomer(-0.1)"></a-button>
        <a-button
          class="btnCss"
          @click="zoomer()">1:1</a-button>
        <a-button
          icon="zoom-in"
          @click="zoomer(0.1)"></a-button>
        <a-button
          v-if="noMobile"
          :icon="params.fullScreen ? 'shrink' : 'arrows-alt'"
          @click="toggleScreen"></a-button>
      </a-button-group>
    </div>
    <configure @on-change="floorDirectionChange" />
    <add-container />
    <update-container-orit />
  </div>
</template>

<script>
import { mapState } from 'vuex';
import role from '@/mixins/role.js';
import Scene from '@/factory/index.js';
import { osType } from '@/utils/device.js';
import { formatTime } from '@/utils/help.js';
import { operation } from '@/views/api.js';
import Configure from 'comps/pop/Configure.vue';
import AddContainer from 'comps/pop/AddContainer.vue';
import UpdateContainerOrit from 'comps/pop/UpdateContainerOrit.vue';

export default {
  name: 'ScadaCanvas',
  components: { Configure, AddContainer, UpdateContainerOrit },
  computed: {
    ...mapState({
      modeStatus: (state) => state.modeStatus,
      application: (state) => state.application,
      config: (state) => state.factory.config,
      params: (state) => state.factory.params,
    }),
  },
  mixins: [role],
  data() {
    return {
      noMobile: !osType(),
      ws: null,
      loading: true,
      timeInterval: null,
      warehouseInfo: null,
      formatTime: formatTime(new Date()),
    };
  },
  created() {
    this.timeInterval = setInterval(() => {
      this.formatTime = formatTime(new Date());
    }, 1000);
  },
  mounted() {
    if (this.$route.name !== 'login') {
      Promise.all([
        this.queryWarehouse(),
      ]).then((res) => {
        this.loading = false;
        const result = res.every((o) => o === 'success');
        if (result) {
          this.$store.commit('SET_APPLICATION', new Scene(this.$refs.gameView, this.warehouseInfo, {
            onInitWS: this.initWS,
            onMarkerList: this.queryMarkerList,
            onDimensionList: this.queryDimensionList,
            onUpdateInfo: this.updateInfo,
            onSelectFrom: this.onSelectFrom,
            onSelectTo: this.onSelectTo,
            onMarkSpace: this.onMark,
            onBatchConfirm: this.onBatchConfirm,
          }, this.$refs.spaceInfo));
        }
      });
    }
  },
  beforeDestroy() {
    this.modeChange('view');
    this.$store.commit('DESTROY_APPLICATION');
    this.ws && this.ws.close();
    this.timeInterval && clearInterval(this.timeInterval);
  },
  methods: {
    onBatchConfirm(map) {
      const arr = [];
      Object.keys(map).forEach((key) => {
        arr.push(map[key]);
      });
      this.$store.commit('SET_SELECT_CONTAINERS', arr);
    },
    async onMark(spaceInfo) {
      const obj = {};
      obj.code = 4;
      obj.object = spaceInfo.spaceId;
      obj.objectId = spaceInfo.spaceId;
      obj.parameter = spaceInfo.status === 0 ? 1 : 0,
      await operation(obj, '/markGround');
    },
    onSelectTo(spaceInfo) {
      this.$store.commit('SET_TO_SPACE_INFO', spaceInfo);
    },
    onSelectFrom(spaceInfo) {
      this.$store.commit('SET_HOVER_SPACE_INFO', spaceInfo);
    },
    popHide() {
      this.$store.commit('SET_CONFIGURE_SHOW');
    },
    allowSound() {
      this.$store.commit('SET_PARAMS', { key: 'allowSound', value: !this.params.allowSound });
    },
    refresh() {
      location.reload();
    },
    screenshot() {
      this.application && this.application.takeScreenshot();
    },
    toggleScreen() {
      this.$store.commit('SET_PARAMS', { key: 'fullScreen', value: !this.params.fullScreen });
      this.$nextTick(() => {
        this.application && this.application.resize();
      });
    },
    zoomer(offset) {
      if (this.application) {
        this.application.zoom(offset);
        this.application.resize();
      }
    },
    floorDirectionChange(value) {
      this.application && this.application.floorDirectionChange(value);
    },
    modeChange(status) {
      this.$store.commit('SET_MODE', status);
    },
  },
};
</script>

<style lang="less" scoped>
.spin-content {
  padding: 30px;
  border: 1px solid #91d5ff;
  background-color: #e6f7ff;
}
.main {
  flex: 1;
  position: relative;
  border: solid 1px #dcdfe6;
  .box {
    width: 100%;
    height: 100%;
    display: flex;
    background: #fff;
    align-items: center;
    justify-content: center;
    canvas {
      width: 100%;
      height: 100%;
      display: block;
    }
  }
  .space-info {
    z-index: 10;
    padding: 8px;
    display: none;
    color: #fff;
    top: 0; left: 0;
    font-size: 14px;
    user-select: none;
    border-radius: 3px;
    position: absolute;
    pointer-events: none;
    transition: all 350ms;
    background: rgba(0, 0, 0, 0.7);
    p { white-space: nowrap; margin: 0; }
  }
  .top {
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    top: 0; left: 10px; right: 10px;
    .status {
      position: relative;
      padding-left: 15px;
      &::before {
        left: 0;
        top: 5px;
        width: 10px;
        height: 10px;
        content: ' ';
        border-radius: 5px;
        position: absolute;
      }
      &.s0::before { background: #808099; }
      &.s1::before { background: #e1021d; }
      &.s2::before { background: #037aff; }
      &.s3::before { background: #009e63; }
    }
  }
  .bottom {
    display: flex;
    justify-content: space-between;
    bottom: 10px; left: 10px; right: 10px;
    .btn-center {
      flex: 1;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      .btn {
        margin: 0 5px;
        padding: 0 10px;
      }
    }
  }
}
.btnCss {
  padding: 0;
  width: 32px;
  .audioCss {
    top: 0;
    left: 2px;
    font-size: 21px;
    position: absolute !important;
  }
}
</style>
