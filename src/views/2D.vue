<template>
  <div class="main">
    <div
      class="box"
      ref="gameBox">
      <div
        v-if="loading"
        class="middle">
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
    <div
      v-show="params.showRobotError"
      :class="['abs', 'error', !errorDisplay && 'now']">
      <div
        class="error-title"
        @click="errorChange">
        <a-icon
          type="bell"
          theme="filled" />
        <span v-show="errorDisplay">【异常机器】{{ Object.keys(robotMapOfError).length }}</span>
      </div>
      <div
        v-show="errorDisplay"
        class="error-body">
        <p v-if="Object.keys(robotMapOfError).length === 0">当前无异常机器</p>
        <div
          class="red"
          v-for="item in robotMapOfError"
          :key="item">{{ item }}</div>
      </div>
    </div>
    <div class="abs bottom">
      <a-button-group>
        <a-button
          icon="menu"
          v-if="$noMobile"
          @click="popHide"></a-button>
        <a-button
          icon="audio"
          v-if="$noMobile"
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
          v-if="$noMobile"
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
import Stats from 'stats.js';
import role from '@/mixins/role.js';
// import Scene from '@/factory/index.js';
import Scene from '@/factory/build.js';
import { formatTime } from '@/utils/help.js';
import Configure from 'comps/pop/Configure.vue';
import AddContainer from 'comps/pop/AddContainer.vue';
import UpdateContainerOrit from 'comps/pop/UpdateContainerOrit.vue';

let statser;
export default {
  name: 'ScadaCanvas',
  components: { Configure, AddContainer, UpdateContainerOrit },
  computed: {
    ...mapState({
      stats: (state) => state.factory.stats,
      modeStatus: (state) => state.modeStatus,
      application: (state) => state.application,
      config: (state) => state.factory.config,
      params: (state) => state.factory.params,
      robotMapOfError: (state) => state.factory.factoryConfig.robotMapOfError,
    }),
  },
  mixins: [role],
  data() {
    return {
      ws: null,
      loading: true,
      isFirst: true,
      errorDisplay: true,
      timeInterval: null,
      formatTime: formatTime(new Date()),
      equipmentsList: [],
    };
  },
  created() {
    console.log('2D created');
    this.timeInterval = setInterval(() => {
      this.formatTime = formatTime(new Date());
    }, 1000);
    Promise.all([
      this.queryWarehouse(),
      this.queryVariablesList(),
      this.configSystemTheme(),
    ]).then(async (res) => {
      const result = res.every((o) => o === 'success');
      if (result) {
        const list = await this.queryEquipmentsList();
        this.equipmentsList = list.data;
        const equipments = Array.from(new Set(list.data.map((item) => item.itemType)));
        this.$store.commit('SET_APPLICATION', new Scene(this.$refs.gameView, this.warehouseInfo, {
          onInitWS: this.initWS,
          onMarkerList: this.queryMarkerList,
          onDimensionList: this.queryDimensionList,
          onUpdateInfo: this.updateInfo,
          onSelectFrom: this.onSelectFrom,
          onSelectTo: this.onSelectTo,
          onMarkSpace: this.onMark,
          onBatchConfirm: this.onBatchConfirm,
        }, this.$refs.spaceInfo, equipments));
      } else {
        this.loading = false;
      }
    });
  },
  mounted() {
    this.createStats();
  },
  activated() {
    this.loading = true;
    if (!this.isFirst) {
      this.isFirst = true;
      this.initWS();
    }
  },
  deactivated() {
    this.ws && this.ws.close();
  },
  beforeDestroy() {
    this.modeChange('view');
    this.ws && this.ws.close();
    this.$store.commit('DESTROY_APPLICATION');
    this.timeInterval && clearInterval(this.timeInterval);
    cancelAnimationFrame(statser);
    this.$store.commit('SET_STATS', null);
  },
  methods: {
    createStats() {
      const stats = new Stats();
      stats.dom.className = 'stats';
      stats.dom.style.position = 'absolute';
      stats.dom.style.top = '28px';
      stats.dom.style.left = 'initial';
      stats.dom.style.right = '10px';
      !this.params.showStats && (stats.dom.style.display = 'none');
      stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
      this.$store.commit('SET_STATS', stats);
      this.$refs.gameBox.appendChild(stats.dom);
      this.animate();
    },
    animate() {
      this.stats.update();
      statser = requestAnimationFrame(this.animate);
    },
    errorChange() {
      this.errorDisplay = !this.errorDisplay;
    },
    onBatchConfirm(map) {
      const arr = [];
      Object.keys(map).forEach((key) => {
        arr.push(map[key]);
      });
      this.$store.commit('SET_SELECT_CONTAINERS', arr);
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
  .error {
    min-width: 120px;
    min-height: 60px;
    border-radius: 4px;
    top: 40px; left: 10px;
    border: solid 1px #ccc;
    .error-title {
      height: 30px;
      display: flex;
      color: #333;
      cursor: pointer;
      padding: 0 10px;
      background: #ccc;
      align-items: center;
    }
    .error-body {
      overflow: auto;
      min-height: 30px;
      max-height: 400px;
      background: #fff;
      p { margin: 0; }
      .red {
        width: 100%;
        color: #e1021d;
        padding: 5px 10px;
        text-align: center;
        border-bottom: solid 1px #ccc;
        &:last-child { border: 0; }
      }
    }
    &.now {
      border: 0;
      min-width: auto;
      min-height: auto;
      .error-title { background: none; }
    }
  }
}
</style>
