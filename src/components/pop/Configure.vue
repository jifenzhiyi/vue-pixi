<template>
<div
  v-if="popShowConfigure"
  class="base-pop">
  <div class="pop-box middle">
    <a
      class="abs close"
      @click="popHide">x</a>
    <div class="title">{{$t('Setting')}}</div>
    <div class="layer">
      <div class="label">{{$t('Floors')}}</div>
      <div class="text">{{$t('FloorN', { floor: floorsCount } )}}</div>
    </div>
    <div
      v-if="floorsCount > 1"
      class="layer">
      <div class="label">{{$t('FloorsLayout')}}</div>
      <div class="text">
        <a-radio-group
          :value="floorDirection"
          @change="radioChange">
          <a-radio value="Horizontal">{{$t('Horizontal')}}</a-radio>
          <a-radio value="Vertical">{{$t('Vertical')}}</a-radio>
        </a-radio-group>
      </div>
    </div>
    <pop-tabs />
    <div class="btn">
      <a-button @click="popHide">{{$t('Dismiss')}}</a-button>
    </div>
  </div>
</div>
</template>

<script>
import { mapState } from 'vuex';
import PopTabs from './Tabs.vue';

export default {
  name: 'PopConfigure',
  components: {
    PopTabs,
  },
  computed: {
    ...mapState(['popShowConfigure']),
    floorDirection() {
      return this.$store.state.factory.params.floorDirection;
    },
    floorsCount() {
      return this.$store.state.factory.factoryConfig.floorsCount;
    },
  },
  methods: {
    popHide() {
      this.$store.commit('SET_CONFIGURE_SHOW');
    },
    radioChange(e) {
      this.$emit('on-change', e.target.value);
      this.$store.commit('SET_PARAMS', { key: 'floorDirection', value: e.target.value });
    },
  },
};
</script>
