<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, onMounted, provide, ref, toRefs, useSlots, watch } from 'vue'
import { useClickRow, useExpandableRow, useFixedColumn, useHeaders, usePageItems, usePagination, useRows, useServerOptions, useTotalItems } from '../hooks'

import type { Header, Item }    from '../types/main'
import type { HeaderForRender } from '../types/internal'

import { generateColumnContent } from '../utils'
import propsWithDefault          from '../propsWithDefault'

import MultipleSelectCheckBox from './MultipleSelectCheckBox.vue'
import SingleSelectCheckBox   from './SingleSelectCheckBox.vue'
import ButtonsPagination      from './ButtonsPagination.vue'
import PaginationArrows       from './PaginationArrows.vue'
import RowsSelector           from './RowsSelector.vue'
import LoadingLine            from './LoadingLine.vue'
import Loading                from './Loading.vue'

const props = defineProps({
  ...propsWithDefault,
  items: {
    type: Array as PropType<Item[]>,
    required: true,
  },
  headers: {
    type: Array as PropType<Header[]>,
    required: true,
  },
})

const emits = defineEmits([
  'clickRow',
  'contextmenuRow',
  'selectRow',
  'deselectRow',
  'expandRow',
  'updateSort',
  'updateFilter',
  'update:itemsSelected',
  'update:serverOptions',
  'updatePageItems',
  'updateTotalItems',
  'selectAll',
])

const {
  tableNodeId,
  clickEventType,
  bodyTextDirection,
  checkboxColumnWidth,
  currentPage,
  expandColumnWidth,
  filterOptions,
  fixedCheckbox,
  fixedExpand,
  fixedHeader,
  fixedIndex,
  headers,
  headerTextDirection,
  indexColumnWidth,
  items,
  itemsSelected,
  loading,
  mustSort,
  multiSort,
  rowsItems,
  rowsPerPage,
  searchField,
  searchValue,
  serverItemsLength,
  serverOptions,
  showIndex,
  sortBy,
  sortType,
  tableHeight,
  tableMinHeight,
  themeColor,
  rowsOfPageSeparatorMessage,
  showIndexSymbol,
  preventContextMenuRow,
} = toRefs(props)

// style related computed variables
const tableHeightPx = computed(() => (tableHeight.value ? `${tableHeight.value}px` : null))
const tableMinHeightPx = computed(() => `${tableMinHeight.value}px`)

// global style related variable
provide('themeColor', themeColor.value)

// slot
const slots = useSlots()
const ifHasPaginationSlot = computed(() => !!slots.pagination)
const ifHasLoadingSlot = computed(() => !!slots.loading)
const ifHasExpandSlot = computed(() => !!slots.expand)
const ifHasBodySlot = computed(() => !!slots.body)

// global dataTable $ref
const dataTable = ref()
const tableBody = ref()
provide('dataTable', dataTable)

// fixed-columns shadow
const showShadow = ref(false)
onMounted(() => {
  tableBody.value.addEventListener('scroll', () => {
    showShadow.value = tableBody.value.scrollLeft > 0
  })
})

const isMultipleSelectable = computed((): boolean => itemsSelected.value !== null)
const isServerSideMode = computed((): boolean => serverOptions.value !== null)

const {
  serverOptionsComputed,
  updateServerOptionsPage,
  updateServerOptionsSort,
  updateServerOptionsRowsPerPage,
} = useServerOptions(
  serverOptions,
  multiSort,
  emits,
)

const {
  clientSortOptions,
  headerColumns,
  headersForRender,
  updateSortField,
  isMultiSorting,
  getMultiSortNumber,
} = useHeaders(
  showIndexSymbol,
  checkboxColumnWidth,
  expandColumnWidth,
  fixedCheckbox,
  fixedExpand,
  fixedIndex,
  headers,
  ifHasExpandSlot,
  indexColumnWidth,
  isMultipleSelectable,
  isServerSideMode,
  mustSort,
  serverOptionsComputed,
  showIndex,
  sortBy,
  sortType,
  multiSort,
  updateServerOptionsSort,
  emits,
)

const {
  rowsItemsComputed,
  rowsPerPageRef,
  updateRowsPerPage,
} = useRows(
  isServerSideMode,
  rowsItems,
  serverOptions,
  rowsPerPage,
)

const {
  totalItems,
  selectItemsComputed,
  totalItemsLength,
  toggleSelectAll,
  toggleSelectItem,
} = useTotalItems(
  clientSortOptions,
  filterOptions,
  isServerSideMode,
  items,
  itemsSelected,
  searchField,
  searchValue,
  serverItemsLength,
  multiSort,
  emits,
)

const {
  currentPaginationNumber,
  maxPaginationNumber,
  isLastPage,
  isFirstPage,
  nextPage,
  prevPage,
  updatePage,
  updateCurrentPaginationNumber,
} = usePagination(
  currentPage,
  isServerSideMode,
  loading,
  totalItemsLength,
  rowsPerPageRef,
  serverOptions,
  updateServerOptionsPage,
)

const {
  currentPageFirstIndex,
  currentPageLastIndex,
  multipleSelectStatus,
  pageItems,
} = usePageItems(
  currentPaginationNumber,
  isMultipleSelectable,
  isServerSideMode,
  items,
  rowsPerPageRef,
  selectItemsComputed,
  showIndex,
  totalItems,
  totalItemsLength,
)

const prevPageEndIndex = computed(() => {
  if (currentPaginationNumber.value === 0)
    return 0
  return (currentPaginationNumber.value - 1) * rowsPerPageRef.value
})

const {
  expandingItemIndexList,
  updateExpandingItemIndexList,
  clearExpandingItemIndexList,
} = useExpandableRow(
  pageItems,
  prevPageEndIndex,
  emits,
)

const {
  fixedHeaders,
  lastFixedColumn,
  fixedColumnsInfos,
} = useFixedColumn(
  headersForRender,
)

const {
  clickRow,
} = useClickRow(
  clickEventType,
  isMultipleSelectable,
  showIndex,
  emits,
)

function contextMenuRow(item: Item, $event: MouseEvent) {
  if (preventContextMenuRow.value)
    $event.preventDefault()
  emits('contextmenuRow', item, $event)
}

// template style generation function
function getColStyle(header: HeaderForRender): string | undefined {
  const width = header.width ?? (fixedHeaders.value.length ? 100 : null)
  if (width)
    return `width: ${width}px; min-width: ${width}px;`
  return undefined
}

function getFixedDistance(column: string, type: 'td' | 'th' = 'th') {
  if (!fixedHeaders.value.length)
    return undefined
  const columInfo = fixedColumnsInfos.value.find(info => info.value === column)
  if (columInfo) {
    return `left: ${columInfo.distance}px;z-index: ${type === 'th' ? 3 : 1};position: sticky;`
  }
  return undefined
}

watch(loading, (newVal, oldVal) => {
  if (serverOptionsComputed.value) {
    // in server-side mode, turn to next page when api request finished.
    if (newVal === false && oldVal === true) {
      updateCurrentPaginationNumber(serverOptionsComputed.value.page)
      clearExpandingItemIndexList()
    }
  }
})

watch(rowsPerPageRef, (value) => {
  if (!isServerSideMode.value) {
    updatePage(1)
  }
  else {
    updateServerOptionsRowsPerPage(value)
  }
})

watch([searchValue, filterOptions], () => {
  if (!isServerSideMode.value) {
    updatePage(1)
  }
})

watch([currentPaginationNumber, clientSortOptions, searchField, searchValue, filterOptions], () => {
  clearExpandingItemIndexList()
}, { deep: true })

watch(pageItems, (value) => {
  emits('updatePageItems', value)
}, { deep: true })

watch(totalItems, (value) => {
  emits('updateTotalItems', value)
}, { deep: true })

defineExpose({
  currentPageFirstIndex,
  currentPageLastIndex,
  clientItemsLength: totalItemsLength,
  maxPaginationNumber,
  currentPaginationNumber,
  isLastPage,
  isFirstPage,
  nextPage,
  prevPage,
  updatePage,
  rowsPerPageOptions: rowsItemsComputed,
  rowsPerPageActiveOption: rowsPerPageRef,
  updateRowsPerPageActiveOption: updateRowsPerPage,
})
</script>

<template>
  <div ref="dataTable" class="ed-table" :class="[tableClassName]">
    <div
      ref="tableBody" class="ed-table__main" :class="{
        'fixed-header': fixedHeader,
        'fixed-height': tableHeight,
        'show-shadow': showShadow,
        'table-fixed': fixedHeaders.length,
        'hoverable': !noHover,
        'border-cell': borderCell,
      }"
    >
      <table :id="tableNodeId">
        <colgroup>
          <col v-for="(header, index) in headersForRender" :key="index" :style="getColStyle(header)">
        </colgroup>
        <slot v-if="slots['customize-headers']" name="customize-headers" />
        <thead
          v-else-if="headersForRender.length && !hideHeader" class="ed-table__header"
          :class="[headerClassName]"
        >
          <tr>
            <th
              v-for="(header, index) in headersForRender" :key="index"
              :class="[{
                sortable: header.sortable,
                none: header.sortable && header.sortType === 'none',
                desc: header.sortable && header.sortType === 'desc',
                asc: header.sortable && header.sortType === 'asc',
                shadow: header.value === lastFixedColumn,
              }, typeof headerItemClassName === 'string' ? headerItemClassName : headerItemClassName(header as Header, index + 1)]" :style="getFixedDistance(header.value)"
              @click.stop="(header.sortable && header.sortType) ? updateSortField(header.value, header.sortType) : null"
            >
              <MultipleSelectCheckBox
                v-if="header.text === 'checkbox'" :key="multipleSelectStatus"
                :status="multipleSelectStatus" @change="toggleSelectAll"
              />
              <span v-else class="header" :class="`direction-${headerTextDirection}`">
                <slot v-if="slots[`header-${header.value}`]" :name="`header-${header.value}`" v-bind="header" />
                <slot
                  v-else-if="slots[`header-${header.value.toLowerCase()}`]"
                  :name="`header-${header.value.toLowerCase()}`" v-bind="header"
                />
                <slot v-else-if="slots.header" name="header" v-bind="header" />
                <span v-else class="header-text">
                  {{ header.text }}
                </span>
                <i
                  v-if="header.sortable" :key="header.sortType ? header.sortType : 'none'" class="sortType-icon"
                  :class="{ desc: header.sortType === 'desc' }"
                />
                <span v-if="multiSort && isMultiSorting(header.value)" class="multi-sort__number">
                  {{ getMultiSortNumber(header.value) }}
                </span>
              </span>
            </th>
          </tr>
        </thead>
        <slot v-if="ifHasBodySlot" name="body" v-bind="pageItems" />
        <tbody
          v-else-if="headerColumns.length" class="ed-table__body"
          :class="{ 'row-alternation': alternating }"
        >
          <slot
            name="body-prepend" v-bind="{
              items: pageItems,
              pagination: {
                isFirstPage,
                isLastPage,
                currentPaginationNumber,
                maxPaginationNumber,
                nextPage,
                prevPage,
              },
              headers: headersForRender,
            }"
          />
          <template v-for="(item, index) in pageItems" :key="index">
            <tr
              :class="[{ 'even-row': (index + 1) % 2 === 0 },
                       typeof bodyRowClassName === 'string' ? bodyRowClassName : bodyRowClassName(item, index + 1)]"
              @click="($event) => {
                clickRow(item, 'single', $event);
                clickRowToExpand && updateExpandingItemIndexList(index + prevPageEndIndex, item, $event);
              }" @dblclick="($event) => { clickRow(item, 'double', $event) }"
              @contextmenu="($event) => { contextMenuRow(item, $event) }"
            >
              <td
                v-for="(column, i) in headerColumns" :key="i" :style="getFixedDistance(column, 'td')"
                :class="[{
                  'shadow': column === lastFixedColumn,
                  'can-expand': column === 'expand',
                }, typeof bodyItemClassName === 'string' ? bodyItemClassName : bodyItemClassName(column, index + 1), `direction-${bodyTextDirection}`]"
                @click="column === 'expand' ? updateExpandingItemIndexList(index + prevPageEndIndex, item, $event) : null"
              >
                <slot v-if="slots[`item-${column}`]" :name="`item-${column}`" v-bind="item" />
                <slot
                  v-else-if="slots[`item-${column.toLowerCase()}`]" :name="`item-${column.toLowerCase()}`"
                  v-bind="item"
                />
                <template v-else-if="column === 'expand'">
                  <i
                    class="expand-icon"
                    :class="{ expanding: expandingItemIndexList.includes(prevPageEndIndex + index) }"
                  />
                </template>
                <template v-else-if="column === 'checkbox'">
                  <SingleSelectCheckBox :checked="item[column]" @change="toggleSelectItem(item)" />
                </template>
                <slot v-else-if="slots.item" name="item" v-bind="{ column, item }" />
                <template v-else>
                  {{ generateColumnContent(column, item) }}
                </template>
              </td>
            </tr>
            <tr
              v-if="ifHasExpandSlot && expandingItemIndexList.includes(index + prevPageEndIndex)"
              :class="[{ 'even-row': (index + 1) % 2 === 0 },
                       typeof bodyExpandRowClassName === 'string' ? bodyExpandRowClassName : bodyExpandRowClassName(item, index + 1)]"
            >
              <td :colspan="headersForRender.length" class="expand">
                <LoadingLine v-if="item.expandLoading" class="expand-loading" />
                <slot name="expand" v-bind="item" />
              </td>
            </tr>
          </template>
          <slot
            name="body-append"
            v-bind="{
              items: pageItems,
              pagination: {
                isFirstPage,
                isLastPage,
                currentPaginationNumber,
                maxPaginationNumber,
                nextPage,
                prevPage,
                updatePage,
              },
              headers: headersForRender,
            }"
          />
        </tbody>
      </table>
      <div v-if="loading" class="ed-table__loading">
        <div class="ed-table__loading-mask " />
        <div class="loading-entity">
          <slot v-if="ifHasLoadingSlot" name="loading" />
          <Loading v-else />
        </div>
      </div>

      <div v-if="!pageItems.length && !loading" class="ed-table__message">
        <slot name="empty-message">
          {{ emptyMessage }}
        </slot>
      </div>
    </div>
    <div v-if="!hideFooter" class="ed-table__footer">
      <div v-if="!hideRowsPerPage" class="pgn__rows-per-page">
        {{ rowsPerPageMessage }}
        <RowsSelector v-model="rowsPerPageRef" :rows-items="rowsItemsComputed" />
      </div>
      <div class="pgn__items-index">
        {{ `${currentPageFirstIndex}–${currentPageLastIndex}` }}
        {{ rowsOfPageSeparatorMessage }} {{ totalItemsLength }}
      </div>

      <slot
        v-if="ifHasPaginationSlot"
        name="pagination"
        v-bind="{
          isFirstPage,
          isLastPage,
          currentPaginationNumber,
          maxPaginationNumber,
          nextPage,
          prevPage,
        }"
      />
      <PaginationArrows
        v-else
        :is-first-page="isFirstPage"
        :is-last-page="isLastPage"
        @click-next-page="nextPage"
        @click-prev-page="prevPage"
      >
        <template v-if="buttonsPagination" #buttonsPagination>
          <ButtonsPagination
            :current-pagination-number="currentPaginationNumber"
            :max-pagination-number="maxPaginationNumber"
            @update-page="updatePage"
          />
        </template>
      </PaginationArrows>
    </div>
  </div>
</template>

<style>
:root {
  /* table */
  --et-border: 1px solid #e0e0e0;
  --et-row-border: 1px solid #e0e0e0;

  /* header-row */
  --et-header-font-size: 12px;
  --et-header-height: 36px;
  --et-header-font-color: #373737;
  --et-header-background-color: #fff;

  /* header-item */
  --et-header-item-padding: 0px 10px;

  /* body-row */
  --et-body-row-height: 36px;
  --et-body-row-font-size: 12px;

  --et-body-row-font-color: #212121;
  --et-body-row-background-color: #fff;

  --et-body-row-hover-font-color: #212121;
  --et-body-row-hover-background-color: #eee;

  --et-body-even-row-font-color: #212121;
  --et-body-even-row-background-color: #fafafa;

  /* body-item */
  --et-body-item-padding: 0px 10px;

  /* footer */
  --et-footer-background-color: #fff;
  --et-footer-font-color: #212121;
  --et-footer-font-size: 12px;
  --et-footer-padding: 0px 5px;
  --et-footer-height: 36px;

  /** footer-rowsPerPage **/
  --et-rows-per-page-selector-width: auto;
  --et-rows-per-page-selector-option-padding: 5px;
  --et-rows-per-page-selector-z-index: auto;

  /* message */
  --et-message-font-color: #212121;
  --et-message-font-size: 12px;
  --et-message-padding: 20px;

  /* loading-mask */
  --et-loading-mask-background-color: #fff;
  --et-loading-mask-opacity: 0.5;

  /* scroll-bar */
  --et-scrollbar-track-color: #fff;
  --et-scrollbar-color: #fff;
  --et-scrollbar-thumb-color: #c1c1c1;
  --et-scrollbar-corner-color: #fff;

  /* buttons-pagination */
  --et-buttons-pagination-border: 1px solid #e0e0e0;
}
</style>

<style lang="scss" scoped>
@import '../scss/ed-table.scss';

.ed-table__main {
  min-height: v-bind(tableMinHeightPx);
}

.ed-table__main.fixed-height {
  height: v-bind(tableHeightPx);
}
</style>
