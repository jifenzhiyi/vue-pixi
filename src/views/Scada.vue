<template>
  <div class="main">
    <scada-header />
      <div class="content">
        <div class="left">首页</div>
        <scada-aside />
    </div>
  </div>
</template>

<script>
import scadaHeader from './template/Header';
import scadaAside from './template/Aside';

export default {
  name: 'Scada',
  components: {
    scadaHeader,
    scadaAside,
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
    .left {
      flex: 1;
    }
  }
}
</style>
