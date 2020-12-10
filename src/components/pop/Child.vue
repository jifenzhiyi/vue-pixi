<template>
  <div class="tabs_one">
    <div class="title">{{title}}</div>
    <div class="one">
      <div
        class="layer"
        v-for="item in list"
        :key="item.label">
        <div class="label">{{ item.label }}</div>
        <div class="text">
          <a-switch
            v-if="item.type === 'switch'"
            v-model="item.value" />
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
              :class="o.value === item.value && 'colorR'">{{ o.label }}</a-radio>
          </a-radio-group>
        </div>
        <div
          class="desc"
          v-if="item.desc"><a-icon type="question-circle" /> {{ item.desc }}</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PopChild',
  props: ['title', 'list'],
  methods: {
    plus() {
      console.log('plus');
    },
    minus() {
      console.log('minus');
    },
  },
};
</script>
