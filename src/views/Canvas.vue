<template>
  <div class="main">
    <div class="box">
      <a-spin
        tip="Loading..."
        :spinning="loading" />
      <canvas
        v-if="!loading"
        ref="gameView"></canvas>
    </div>
    <div class="abs top">
      <div class="time">{{ formatTime }}</div>
      <div :class="['status', `s${systemStatus}`]">{{ $t(statusMap.title) }}</div>
    </div>
  </div>
</template>

<script>
import role from '@/mixins/role';
import { formatTime } from '@/utils/help.js';

export default {
  name: 'ScadaCanvas',
  mixins: [role],
  data() {
    return {
      ws: null,
      loading: true,
      formatTime: formatTime(new Date()),
      timeInterval: null,
    };
  },
  created() {
    this.timeInterval = setInterval(() => {
      this.formatTime = formatTime(new Date());
    }, 1000);
    if (this.$route.name !== 'login') {
      this.loading = false;
      // Promise.all([
      //   this.queryWarehouse(),
      //   this.queryDimensionList(),
      // ]).then(() => {
      //   this.loading = false;
      // });
    }
  },
  mounted() {
    // this.initWS();
  },
  beforeDestroy() {
    this.ws && this.ws.close();
    this.timeInterval && clearInterval(this.timeInterval);
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
}
</style>
