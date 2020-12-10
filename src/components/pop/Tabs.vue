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
            { label: '位置', value: true, type: 'switch' },
            { label: '通道', value: true, type: 'switch' },
            { label: '货架泊位', value: true, type: 'switch' },
            { label: '无效位置', value: true, type: 'switch' },
            { label: '等待位', value: true, type: 'switch' },
            { label: '安全位置', value: true, type: 'switch' },
            { label: '位置编号', value: false, type: 'switch', desc: '如果界面卡顿, 请关闭此选项' },
          ],
        },
        {
          key: 1,
          tab: 'Robot',
          list: [
            { label: '机器人', value: true, type: 'switch' },
            { label: '离线机器人', value: false, type: 'switch' },
            { label: '机器人路径', value: true, type: 'switch' },
            { label: '机器人编号', value: false, type: 'switch' },
            { label: '机器人移动速度', value: 1.5, type: 'input_num', num: 0.1 },
            { label: '机器人超时', value: 60, type: 'input', unit: '秒' },
            { label: '异常机器人报警', value: true, type: 'switch' },
            { label: '异常机器人超时', value: 10, type: 'input', unit: '秒' },
          ],
        },
        {
          key: 2,
          tab: 'Container', 
          list: [
            { label: '货架', value: true, type: 'switch' },
            { label: '货架编号', value: false, type: 'switch' },
            {
              label: '货架显示方式',
              value: 'frequence',
              type: 'radio',
              options: [
                { label: '热度', value: 'frequence' },
                { label: '类型', value: 'type' },
              ], // 货架显示方式 frequence热度 type类型
            },
            // { label: '空满状态', value: false, type: 'switch' },
          ],
        },
        { key: 3, tab: 'Terminal', list: [{ label: '工作站', value: true, type: 'switch' }] },
        {
          key: 4,
          tab: 'Others',
          list: [
            { label: '标记', value: true, type: 'switch' },
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
