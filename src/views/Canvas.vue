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
          @click="popHide"></a-button>
        <a-button
          icon="audio"
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
          :icon="params.fullScreen ? 'shrink' : 'arrows-alt'"
          @click="toggleScreen"></a-button>
      </a-button-group>
    </div>
    <configure @on-change="floorDirectionChange" />
  </div>
</template>

<script>
import { mapState } from 'vuex';
import Scene from '@/factory';
import role from '@/mixins/role';
import { formatTime } from '@/utils/help.js';
import Configure from 'comps/pop/Configure.vue';

export default {
  name: 'ScadaCanvas',
  components: { Configure },
  computed: {
    ...mapState({
      config: (state) => state.factory.config,
      params: (state) => state.factory.params,
    }),
  },
  mixins: [role],
  data() {
    return {
      ws: null,
      loading: true,
      application: null,
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
          this.application = new Scene(this.$refs.gameView, this.warehouseInfo, {
            onInitWS: this.initWS,
            onMarkerList: this.queryMarkerList,
            onDimensionList: this.queryDimensionList,
            onUpdateInfo: this.updateInfo,
          }, this.$refs.spaceInfo);
        }
      });
    }
  },
  beforeDestroy() {
    this.application && this.application.destroy();
    this.application = null;
    this.ws && this.ws.close();
    this.timeInterval && clearInterval(this.timeInterval);
  },
  methods: {
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
    },
    zoomer(offset) {
      if (this.application) {
        this.application.zoom(offset);
        this.application.resize();
      }
    },
    floorDirectionChange(value) {
      console.log('floorDirectionChange value', value);
      this.application && this.application.floorDirectionChange(value);
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
