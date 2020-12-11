<template>
  <div class="abs aside-info">
    <div class="info-edit">
      <div
        class="edit-one"
        v-for="(item, idx) in list"
        :key="item">
        <div class="title">{{$t(item)}}</div>
        <div class="one">
          <div class="label">{{$t('ID')}}：</div>
          <a-input
            :placeholder="$t('PleaseEnterID', { param: $t(param[idx]) })" />
        </div>
        <div class="one">
          <div class="label">坐标：</div>
          <div class="text">X -，Y -</div>
        </div>
        <div
          v-show="idx === 0"
          class="btn">
          <a-button>{{$t('Update')}}</a-button>
          <a-button>{{$t('MoveContainer')}}</a-button>
          <a-button>{{$t('RemoveContainer')}}</a-button>
          <a-button>{{$t('updateContainerOrit')}}</a-button>  
        </div>
        <div
          v-show="idx === 1"
          class="btn">
          <a-button>移动机器人</a-button>
          <a-button>重启机器人</a-button>
        </div>
        <!-- <div
          v-show="idx === 2"
          class="btn"></div> -->
        <div
          v-show="idx === 3"
          class="btn">
          <a-button>新增货架</a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AsideEdit',
  data() {
    return {
      list: ['Container', 'RobotInfo', 'TerminalInfo', 'Space'],
      param: ['ContainerPlace', 'Robot', 'Terminal', 'SpacePlace'],
    };
  },
};
</script>

<style lang="less" scoped>
.aside-info {
  overflow: auto;
  border: solid 1px #ddd;
}
.info-edit {
  display: flex;
  padding: 0 15px;
  border-radius: 4px;
  flex-direction: column;
  .edit-one {
    padding-bottom: 15px;
    border-bottom: solid 1px #ddd;
    .title {
      color: #333;
      padding-top: 15px;
      font-weight: bold;
    }
    .one {
      display: flex;
      font-size: 13px;
      padding-top: 10px;
      align-items: center;
      .label { width: 40px; }
      .ant-input { flex: 1; }
    }
    .btn {
      .ant-btn {
        height: 30px;
        font-size: 12px;
        padding: 0 13px;
        margin-top: 10px;
        margin-right: 10px;
      }
    }
    &:last-child { border: 0; }
  }
}
</style>
