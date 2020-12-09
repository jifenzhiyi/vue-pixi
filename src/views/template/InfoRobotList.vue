<template>
<div class="info-main">
  <div class="info-list">
    <div class="info-one">
      <div
        class="ellipsis"
        v-for="item in list"
        :key="item">{{ $t(item) }}</div>
    </div>
    <div
      class="info-one"
      v-for="item in robotMapList"
      :key="item.robotMapList">
      <span>{{ item.robotId }}</span>
      <span>{{ item.posX }}</span>
      <span>{{ item.posY }}</span>
      <span>{{ item.posZ }}</span>
      <span :class="`s${item.status}`">{{ $t(item.statusName) }}</span>
      <span>{{ item.voltageNew }}</span>
    </div>
  </div>
</div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'InfoRobotList',
  computed: {
    ...mapState({
      robotMap: (state) => state.factory.factoryConfig.robotMap,
    }),
    robotMapList() {
      return Object.keys(this.robotMap).map((key) => {
        this.robotMap[key].status === -1 && (this.robotMap[key].statusName = 'Offline');
        this.robotMap[key].status === 0 && (this.robotMap[key].statusName = 'Idle');
        this.robotMap[key].status === 1 && (this.robotMap[key].statusName = 'Load');
        this.robotMap[key].status === 3 && (this.robotMap[key].statusName = 'Charging');
        this.robotMap[key].status === 99 && (this.robotMap[key].statusName = 'Problem');
        this.robotMap[key].voltageNew = `${this.robotMap[key].voltage * 100}%`;
        return this.robotMap[key];
      });
    },
  },
  data() {
    return {
      list: ['Robot', 'Column', 'Row', 'Layer', 'Status', 'voltage'],
    };
  },
};
</script>

<style lang="less" scoped>
.info-main {
  padding: 10px 0;
  .info-list {
    display: flex;
    flex-direction: column;
    border: solid 1px #ddd;
    .info-one {
      height: 30px;
      display: flex;
      align-items: center;
      border-bottom: solid 1px #ddd;
      .ellipsis {
        width: 20%;
        font-size: 12px;
        font-weight: bold;
        text-align: center;
      }
      &:last-child { border: 0; }
      span {
        width: 20%;
        height: 30px;
        display: flex;
        font-size: 12px;
        align-items: center;
        justify-content: center;
        &.s0 { color: rgb(0, 0, 0); }
        &.s1 { color: rgb(0, 148, 75); }
        &.s3 { color: rgb(0, 95, 255); }
        &.s99 { color: rgb(255, 2, 0); }
      }
    }
  }
}
</style>
