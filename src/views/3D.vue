<template>
  <div 
    id="gameBox"
    class="main">
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
          v-if="$noMobile"
          @click="popHide"></a-button>
        <a-button
          icon="sync"
          @click="refresh"></a-button>
        <a-button
          icon="camera"
          @click="screenshot"></a-button>
      </a-button-group>
      <div
        v-if="$noMobile"
        class="btn-center">
        <a-button
          class="btn"
          v-if="modeStatus === 'view'"
          @click="modeChange('edit')">{{$t('EditMode')}}</a-button>
        <a-button
          class="btn"
          v-if="modeStatus === 'view'"
          @click="modeChange('mark')">{{$t('SpaceMode')}}</a-button>
        <!-- <a-button
          class="btn"
          v-if="modeStatus === 'view'"
          @click="modeChange('batch')">{{$t('editContainers')}}</a-button> -->
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
          @click="zoomer(1)"></a-button>
        <a-button
          class="btnCss"
          @click="zoomer()">1:1</a-button>
        <a-button
          icon="zoom-in"
          @click="zoomer(-1)"></a-button>
        <a-button
          v-if="$noMobile"
          :icon="params.fullScreen ? 'shrink' : 'arrows-alt'"
          @click="toggleScreen"></a-button>
      </a-button-group>
    </div>
    <configure @on-change="floorDirectionChange" />
  </div>
</template>

<script>
import { mapState } from 'vuex';
import role from '@/mixins/role.js';
import Game from '@/factory/game.js';
import { formatTime } from '@/utils/help.js';
import Configure from 'comps/pop/Configure.vue';

export default {
  name: 'base3D',
  mixins: [role],
  components: { Configure },
  computed: {
    ...mapState({
      game: (state) => state.game,
      config: (state) => state.factory.config,
      params: (state) => state.factory.params,
      modeStatus: (state) => state.modeStatus,
    }),
  },
  data() {
    return {
      ws: null,
      loading: true,
      isFirst: true,
      timeInterval: null,
      formatTime: formatTime(new Date()),
    };
  },
  created() {
    this.timeInterval = setInterval(() => {
      this.formatTime = formatTime(new Date());
    }, 1000);
  },
  mounted() {
    Promise.all([
      this.queryWarehouse(),
    ]).then((res) => {
      const result = res.every((o) => o === 'success');
      if (result) {
        this.$store.commit('SET_GAME', new Game(this.$refs.gameView, this.warehouseInfo, () => {
          this.queryDimensionList();
          this.initWS(); // 使用真实数据
        }));
      } else {
        this.loading = false;
      }
    });
  },
  activated() {
    this.loading = true;
    !this.isFirst && this.initWS();
  },
  deactivated() {
    this.ws && this.ws.close();
  },
  beforeDestroy() {
    this.modeChange('view');
    this.ws && this.ws.close();
    this.timeInterval && clearInterval(this.timeInterval);
  },
  methods: {
    popHide() {
      this.$store.commit('SET_CONFIGURE_SHOW');
    },
    toggleScreen() {
      this.$store.commit('SET_PARAMS', { key: 'fullScreen', value: !this.params.fullScreen });
      this.$nextTick(() => {
        this.game && this.game.onWindowResize();
      });
    },
    screenshot() {
      this.game && this.game.takeScreenshot();
    },
    zoomer(offset) {
      this.game && this.game.zoom(offset);
    },
    floorDirectionChange(value) {
      console.log('floorDirectionChange val', value);
    },
    modeChange(status) {
      this.$store.commit('SET_MODE', status);
    },
  },
};
</script>

<style lang="less" scoped>
.main {
  overflow: hidden;
  .space-info {
    z-index: 10;
    padding: 12px;
    color: #fff;
    top: 0; right: 0;
    font-size: 14px;
    user-select: none;
    position: absolute;
    pointer-events: none;
    transition: all 350ms;
    background: rgba(0, 0, 0, 0.4);
    p {
      white-space: nowrap;
      margin: 0;
      &.robotId span { padding-left: 10px; color: #e1021d; }
    }
  }
  .top {
    height: 30px;
    display: flex;
    align-items: center;
    top: 0; left: 10px; right: 10px;
    .status {
      margin-left: 20px;
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
}
</style>
