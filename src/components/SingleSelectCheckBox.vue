<script setup lang="ts">
import { inject } from 'vue'

defineProps({
  checked: { type: Boolean, required: true },
})

const emits = defineEmits(['change'])

const themeColor = inject('themeColor')
</script>

<template>
  <div
    class="easy-checkbox"
    @click.stop.prevent="emits('change')"
  >
    <input
      type="checkbox"
      :checked="checked"
    >
    <label for="checbox" />
  </div>
</template>

<style lang="scss" scoped>
@import '../scss/checbox.scss';

$checkbox-checked-color: v-bind(themeColor);

.easy-checkbox {
  input[type="checkbox"] {
    &:checked {
      + label:before{
        background: $checkbox-checked-color;
      }
    }
  }
}
</style>
