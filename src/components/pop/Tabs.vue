<template>
  <div class="pop_tabs">
    <div class="nav">
      <div
        v-for="item in tabList"
        :key="item.key"
        :class="['one ellipsis', tabKey === item.key && 'now']"
        @click="tabChange(item.key)">{{ $t(item.tab) }}</div>
    </div>
    <div class="content">
      <pop-child
        v-for="item in tabList"
        v-show="tabKey === item.key"
        :key="item.tab"
        :title="$t(item.tab)"
        :list="item.list" />
    </div>
  </div>
</template>

<script>
import storage from '@/utils/storage';
import PopChild from './Child.vue';

export default {
  name: 'PopTabs',
  components: {
    PopChild,
  },
  data() {
    return {
      tabKey: 0,
      tabList: [
        {
          key: 0,
          tab: 'Space',
          list: [
            { label: 'SpacePlace', value: true, type: 'switch' },
            { label: 'LinkPlace', value: true, type: 'switch' },
            { label: 'ContainerSlot', value: true, type: 'switch' },
            { label: 'InvalidSpace', value: true, type: 'switch' },
            { label: 'waitingSpace', value: true, type: 'switch' },
            { label: 'SafeSpace', value: true, type: 'switch' },
            { label: 'spaceId', param: 'showSpaceId', value: storage.get('showSpaceId') || false, type: 'switch', desc: 'TipOfStuck' },
          ],
        },
        {
          key: 1,
          tab: 'Robot',
          list: [
            { label: 'Robot', value: true, type: 'switch' },
            { label: 'OfflineRobot', value: false, type: 'switch' },
            { label: 'robotPath', value: true, type: 'switch' },
            { label: 'robotId', value: false, type: 'switch' },
            { label: 'robotMoveSpeed', value: 1.5, type: 'input_num', num: 0.1 },
            { label: 'RobotTimeout', value: 60, type: 'input', unit: '秒' },
            { label: 'AbnormalAlarm', value: true, type: 'switch' },
            { label: 'AbnormalTimeout', value: 10, type: 'input', unit: '秒' },
          ],
        },
        {
          key: 2,
          tab: 'Container', 
          list: [
            { label: 'Container', value: true, type: 'switch' },
            { label: 'ContainerId', value: false, type: 'switch' },
            {
              label: 'ShowTypeOfContainer',
              value: 'frequence',
              type: 'radio',
              options: [
                { label: 'Frequently', value: 'frequence' },
                { label: 'Type', value: 'type' },
              ], // 货架显示方式 frequence热度 type类型
            },
            // { label: '空满状态', value: false, type: 'switch' },
          ],
        },
        { key: 3, tab: 'Terminal', list: [{ label: 'Terminal', value: true, type: 'switch' }] },
        {
          key: 4,
          tab: 'Others',
          list: [
            { label: 'Marker', value: true, type: 'switch' },
            { label: 'stats', value: false, type: 'switch' },
          ],
        },
      ],
    };
  },
  methods: {
    tabChange(key) {
      this.tabKey = key;
    },
  },
};
</script>

<style lang="less" scoped>
.pop_tabs {
  flex: 1;
  display: flex;
  overflow: hidden;
  margin-top: 20px;
  border-radius: 5px;
  flex-direction: column;
  border: solid 1px #ddd;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.12), 0 0 6px 0 rgba(0, 0, 0, 0.04);
  .nav {
    display: flex;
    justify-content: space-between;
    .one {
      width: 33%;
      height: 40px;
      padding: 0 10px;
      cursor: pointer;
      color: #909399;
      line-height: 40px;
      text-align: center;
      background: #F5F7FA;
      border-left: solid 1px #ddd;
      border-bottom: solid 1px #ddd;
      &:last-child { border-right: solid 1px #ddd; }
      &.now {
        color: #E20028;
        border-bottom: 0;
        background: #fff;
      }
    }
  }
  .content {
    flex: 1;
    overflow: auto;
    padding: 0 15px;
    border: solid 1px #ddd;
    border-top: 0;
  }
}
</style>
