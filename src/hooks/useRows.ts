import { computed, ref } from 'vue'
import type { Ref } from 'vue'
import type { ServerOptions } from '../types/main'

export function useRows(
  isServerSideMode: Ref<boolean>,
  rowsItems: Ref<number[]>,
  serverOptions: Ref<ServerOptions | null>,
  rowsPerPage: Ref<number>,
) {
  const rowsItemsComputed = computed((): number[] => {
    if (!isServerSideMode.value && rowsItems.value.findIndex(item => item === rowsPerPage.value) === -1) {
      return [rowsPerPage.value, ...rowsItems.value]
    }
    return rowsItems.value
  })

  const rowsPerPageRef = ref(serverOptions.value ? serverOptions.value.rowsPerPage : rowsPerPage.value)

  const updateRowsPerPage = (option: number) => {
    rowsPerPageRef.value = option
  }

  return {
    rowsItemsComputed,
    rowsPerPageRef,
    updateRowsPerPage,
  }
}
