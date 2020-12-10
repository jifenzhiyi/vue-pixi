<template>
  <div class="tabs_one">
    <div class="title">{{title}}</div>
    <div class="one">
      <div
        class="layer"
        v-for="item in list"
        :key="item.label">
        <div class="label">
          {{$t(item.label)}}
          <p v-if="!item.param">(功能待添加)</p>
        </div>
        <div class="text">
          <a-switch
            v-if="item.type === 'switch'"
            v-model="item.value"
            @focus="focus(item.param)"
            @change="switchChange" />
          <a-input
            v-if="item.type === 'input'"
            v-model="item.value"
            :suffix="item.unit"
            onkeyup="value=value.replace(/[^\d]/g,'')" />
          <a-input
            v-if="item.type === 'input_num'"
            :default-value="item.value"
            onkeyup="value=value.replace(/[^.\d]/g,'')">
            <a-icon
              slot="addonBefore"
              type="plus"
              @click="plus" />
            <a-icon
              slot="addonAfter"
              type="minus" 
              @click="minus"/>
          </a-input>
          <a-radio-group :default-value="item.value">
            <a-radio
              v-for="o in item.options"
              :key="o.value"
              :value="o.value"
              :class="o.value === item.value && 'colorR'">{{$t(o.label)}}</a-radio>
          </a-radio-group>
        </div>
        <div
          class="desc"
          v-if="item.desc"><a-icon type="question-circle" /> {{$t(item.desc)}}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'PopChild',
  props: ['title', 'list'],
  computed: {
    ...mapState({
      application: (state) => state.application,
    }),
  },
  data() {
    return {
      param: '',
    };
  },
  methods: {
    plus() {
      console.log('plus');
    },
    minus() {
      console.log('minus');
    },
    focus(param) {
      this.param = param;
    },
    switchChange(value) {
      if (this.param) {
        this.$store.commit('SET_PARAMS', { key: this.param, value });
        this.application && this.application[this.param](value);
      } else {
        console.log('该功能正在开发。。。请稍后');
      }
    },
  },
};
</script>
