<template>
  <div class="main">
    <scada-header />
      <div class="content">
        <scada-canvas />
        <scada-aside />
    </div>
  </div>
</template>

<script>
import scadaHeader from './template/Header';
import scadaAside from './template/Aside';
import scadaCanvas from './Canvas';

export default {
  name: 'Scada',
  components: {
    scadaHeader,
    scadaAside,
    scadaCanvas,
  },
};
</script>

<style lang="less" scoped>
.main {
  height: 100%;
  display: flex;
  flex-direction: column;
  .content {
    flex: 1;
    padding: 10px;
    padding-top: 0;
    display: flex;
  }
}
</style>
