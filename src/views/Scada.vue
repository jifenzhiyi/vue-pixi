<template>
  <div class="scada">
    <scada-header
      v-if="noMobile"
      v-show="!fullScreen" />
    <div :class="['content', (fullScreen || !noMobile) && 'fullScreen']">
      <scada-canvas />
      <scada-aside
        v-if="noMobile"
        v-show="!fullScreen" />
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { osType } from '@/utils/device.js';
import scadaHeader from './template/Header.vue';
import scadaAside from './template/Aside.vue';
import scadaCanvas from './Canvas.vue';

export default {
  name: 'Scada',
  data() {
    return {
      noMobile: !osType(),
    }
  },
  computed: {
    ...mapState({
      fullScreen: (state) => state.factory.params.fullScreen,
    }),
  },
  components: {
    scadaHeader,
    scadaAside,
    scadaCanvas,
  },
};
</script>

<style lang="less" scoped>
.scada {
  height: 100%;
  display: flex;
  flex-direction: column;
  .content {
    flex: 1;
    display: flex;
    padding: 10px;
    padding-top: 0;
    overflow: hidden;
    &.fullScreen {
      padding: 0;
    }
  }
}
</style>
