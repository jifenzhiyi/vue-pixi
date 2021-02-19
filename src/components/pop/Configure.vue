<template>
<div
  v-if="popShowConfigure"
  class="base-pop">
  <div class="pop-box middle">
    <a
      class="abs close"
      @click="popHide">x</a>
    <div class="title">{{$t('Setting')}}</div>
    <div class="layer">
      <div class="label">{{$t('Floors')}}</div>
      <div class="text">
        <a-checkbox-group
          v-model="floorsVisible"
          :options="warehouseLayerNo"
          @change="toggleFloor" />
      </div>
    </div>
    <div
      v-if="floorsCount > 1"
      class="layer">
      <div class="label">{{$t('FloorsLayout')}}</div>
      <div class="text">
        <a-radio-group
          :value="floorDirection"
          @change="radioChange">
          <a-radio value="Horizontal">{{$t('Horizontal')}}</a-radio>
          <a-radio value="Vertical">{{$t('Vertical')}}</a-radio>
        </a-radio-group>
      </div>
    </div>
    <pop-tabs />
    <div class="btn">
      <a-button @click="popHide">{{$t('Dismiss')}}</a-button>
    </div>
  </div>
</div>
</template>

<script>
import { mapState } from 'vuex';
import PopTabs from './Tabs.vue';

export default {
  name: 'PopConfigure',
  components: {
    PopTabs,
  },
  data() {
    return {
      floorsVisible: [],
    };
  },
  computed: {
    ...mapState(['popShowConfigure', 'application']),
    floorDirection() {
      return this.$store.state.factory.params.floorDirection;
    },
    floorsCount() {
      return this.$store.state.factory.factoryConfig.floorsCount;
    },
    warehouseLayerNo() {
      const arr = [];
      for (let i = 0; i < this.floorsCount; i++) {
        arr.push({ value: i + 1, label: this.$t('FloorN', { floor: i + 1 }) });
      }
      return arr;
    },
  },
  watch: {
    floorsCount: {
      immediate: false,
      deep: false,
      handler() {
        this.floorsInit();
      },
    },
  },
  methods: {
    floorsInit() {
      for (let i = 0; i < this.floorsCount; i++) {
        this.floorsVisible.push(i + 1);
      }
    },
    toggleFloor(checkedValues) {
      this.application && this.application.toggleFloor(checkedValues);
    },
    popHide() {
      this.$store.commit('SET_CONFIGURE_SHOW');
    },
    radioChange(e) {
      this.$emit('on-change', e.target.value);
      this.$store.commit('SET_PARAMS', { key: 'floorDirection', value: e.target.value });
    },
  },
};
</script>
