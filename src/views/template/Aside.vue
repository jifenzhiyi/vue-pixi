<template>
  <aside>
    <div :class="['status', `s${systemStatus}`]">
      <h3>{{ $t('SystemStatus') }}</h3>
      <a-radio-group
        class="radio_group"
        :class="language === 'ja-JP' && 'radio_group_ja'"
        :value="systemStatus"
        :disabled="!buttonTypeList.updateSystemStatus"
        @change="radioChange">
        <a-radio
          v-for="item in systemStatusMap"
          :class="['radio_css', systemStatus === item.value && `s${item.value}`]"
          :key="item.value"
          :value="item.value">{{ $t(item.title) }}</a-radio>
      </a-radio-group>
    </div>

    <div
      v-show="modeStatus === 'view' || modeStatus === 'mark'"
      v-if="buttonTypeList.updateSystemParameter"
      class="aside-desc">
      <h4>{{$t('OrderMode')}}</h4>
      <div class="one">
        <p>{{$t('ReadOrdersMode')}}</p>
        <a-radio-group
          :default-value="ReadOrdersMode"
          @change="(e) => statusChangeNew(e, 'ReadOrdersMode')">
          <a-radio value="1">{{$t('Start')}}</a-radio>
          <a-radio value="0">{{$t('Stop')}}</a-radio>
        </a-radio-group>
      </div>
      <div class="one">
        <p>{{$t('HandelingMode')}}</p>
        <a-radio-group
          :default-value="HandelingMode"
          @change="(e) => statusChangeNew(e, 'HandelingMode')">
          <a-radio value="0">{{$t('EfficiencyFirst')}}</a-radio>
          <a-radio value="1">{{$t('PathFirst')}}</a-radio>
        </a-radio-group>
      </div>
    </div>

    <div class="aside-main">
      <aside-info v-show="modeStatus === 'view' || modeStatus === 'mark'" />
      <aside-edit v-show="modeStatus === 'edit'" />
      <aside-batch v-show="modeStatus === 'batch'" />
    </div>
  </aside>
</template>

<script>
import { mapState } from 'vuex';
import role from '@/mixins/role.js';
import asideInfo from './AsideInfo.vue';
import asideEdit from './AsideEdit.vue';
import asideBatch from './AsideBatch.vue';

export default {
  name: 'ScadaAside',
  computed: {
    ...mapState(['modeStatus', 'language']),
  },
  mixins: [role],
  components: {
    asideInfo,
    asideEdit,
    asideBatch,
  },
};
</script>

<style lang="less" scoped>
aside {
  width: 320px;
  height: 100%;
  display: flex;
  overflow: hidden;
  margin-left: 10px;
  flex-direction: column;
  .status {
    height: 90px;
    padding: 10px;
    display: flex;
    overflow: hidden;
    border-radius: 4px;
    flex-direction: column;
    justify-content: space-around;
    &.s0 { background: #808099; }
    &.s1 { background: #e1021d; }
    &.s2 { background: #037aff; }
    &.s3 { background: #009e63; }
    h3 { color: #fff; }
    .radio_group {
      display: flex;
      justify-content: space-between;
    }
    .radio_group_ja {
      display: block;
    }
  }
  .aside-desc {
    height: 150px;
    padding: 15px;
    margin-top: 10px;
    border-radius: 4px;
    border: solid 1px #ddd;
    .one {
      padding-bottom: 10px;
      .ant-radio-wrapper {
        margin-right: 50px;
      }
      p {
        margin: 0;
      }
    }
  }
  .aside-main {
    flex: 1;
    width: 100%;
    display: flex;
    overflow: auto;
    margin-top: 10px;
    border-radius: 4px;
    flex-direction: column;
  }
}
.radio_css { color: #ccc; }
@media screen and (max-width: 850px) {
  aside {
    display: none;
  }
}
@media all and (orientation: portrait) and (max-width: 700px) {
  aside {
    display: none;
  }
}
</style>
