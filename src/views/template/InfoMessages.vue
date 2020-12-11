<template>
  <div class="info">
    <div class="one">
      <div class="title">{{ $t('SpaceNum') }}：{{ factoryConfig.spaceCount }}</div>
      <div class="sub">
        <div class="child c1">{{ $t('ChargeSpace') }}：{{ factoryConfig.spaceCountOfCharger }}</div>
      </div>
    </div>
    <div class="one">
      <div class="title">{{ $t('ContainerNum') }}：{{ factoryConfig.containerCount }}</div>
    </div>
    <div class="one">
      <div class="title">{{ $t('RobotNum') }}：{{ factoryConfig.robotCount.sum }}</div>
      <div class="sub2 clearfix">
        <div class="child s1">{{ $t('Load') }}：{{ factoryConfig.robotCount['robotCountOf1'] }}</div>
        <div class="child s2">{{ $t('Idle') }}：{{ factoryConfig.robotCount['robotCountOf0'] }}</div>
        <div class="child s3">{{ $t('Charging') }}：{{ factoryConfig.robotCount['robotCountOf3'] }}</div>
        <div class="child s4">{{ $t('Offline') }}：{{ factoryConfig.robotCount['robotCountOf-1'] }}</div>
        <div class="child s5">{{ $t('Problem') }}：{{ factoryConfig.robotCount['robotCountOf99'] }}</div>
      </div>
    </div>
    <div class="one">
      <div class="title">{{ $t('TerminalNum') }}：{{ factoryConfig.terminalCount.sum }}</div>
      <div class="sub">
        <div class="child c2">{{ $t('Run') }}：{{ factoryConfig.terminalCount['terminalCountOf1'] }}</div>
        <div class="child c3">{{ $t('Pausing') }}：{{ factoryConfig.terminalCount['terminalCountOf2'] }}</div>
        <div class="child c4">{{ $t('Offline') }}：{{ factoryConfig.terminalCount['terminalCountOf0'] }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'InfoMessages',
  computed: {
    ...mapState({
      factoryConfig: (state) => state.factory.factoryConfig,
    }),
  },
};
</script>

<style lang="less" scoped>
.info {
  display: flex;
  flex-direction: column;
  .one {
    padding: 10px 0;
    border-bottom: solid 1px #ddd;
    &:last-child { border: 0; }
    .sub {
      display: flex;
      padding-top: 10px;
      justify-content: space-between;
      .child {
        padding-left: 20px;
        position: relative;
        &::before {
          left: 0;
          top: 50%;
          width: 1rem;
          height: 1rem;
          content: ' ';
          margin-top: -0.5rem;
          position: absolute;
        }
        &.c1::before { background: rgb(255, 227, 95); }
        &.c2::before { background: rgb(54, 171, 74); }
        &.c3::before { background: rgb(255, 89, 109); }
        &.c4::before { background: rgb(106, 106, 111); }
      }
    }
    .sub2 {
      padding-top: 10px;
      .child {
        float: left;
        margin-top: 5px;
        padding: 0 25px 0 20px;
        position: relative;
        &::before {
          left: 0;
          top: 50%;
          width: 1rem;
          height: 1rem;
          content: ' ';
          border: solid 5px transparent;
          position: absolute;
          margin-top: -0.5rem;
          border-radius: 50%;
        }
        &.s1::before { border-color: rgb(0, 148, 75); }
        &.s2::before { border-color: rgb(0, 0, 0); }
        &.s3::before { border-color: rgb(0, 95, 255); }
        &.s4::before { border-color: rgb(195, 203, 222); }
        &.s5::before { border-color: rgb(255, 2, 0); }
      }
    }
  }
}
</style>
