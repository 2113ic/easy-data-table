<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, inject } from 'vue'

const props = defineProps({
  status: { type: String as PropType<'noneSelected' | 'partSelected' | 'allSelected'>, required: true },
})

const emits = defineEmits(['change'])

const isChecked = computed(() => props.status === 'allSelected')

function toggleChecked() {
  emits('change', !isChecked.value)
}

const themeColor = inject('themeColor')
</script>

<template>
  <div
    class="easy-checkbox"
    @click.stop.prevent="toggleChecked"
  >
    <input
      type="checkbox"
      :checked="isChecked"
      :class="status"
    >
    <label for="checbox" />
  </div>
</template>

<style lang="scss" scoped>
@import '../scss/checbox.scss';

$checkbox-checked-color: v-bind(themeColor);

.easy-checkbox {
  input[type="checkbox"] {
    &.allSelected, &.partSelected {
      + label:before{
        background: $checkbox-checked-color;
      }
    }
  }
}
</style>
