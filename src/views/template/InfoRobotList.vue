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
  .info-list .info-one .ellipsis { width: 20%; }
}
</style>
