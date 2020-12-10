<template>
  <div class="scada">
    <scada-header v-show="!fullScreen" />
    <div :class="['content', fullScreen && 'fullScreen']">
      <scada-canvas />
      <scada-aside v-show="!fullScreen" />
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import scadaHeader from './template/Header';
import scadaAside from './template/Aside';
import scadaCanvas from './Canvas';

export default {
  name: 'Scada',
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
    padding: 10px;
    padding-top: 0;
    display: flex;
    &.fullScreen {
      padding: 0;
      overflow: hidden;
    }
  }
}
</style>
