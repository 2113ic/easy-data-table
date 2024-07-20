import type { SortType } from './main'

export interface ServerOptionsComputed {
  page: number
  rowsPerPage: number
  sortBy: string | string[] | null
  sortType: SortType | SortType[] | null
}

export interface HeaderForRender {
  text: string
  value: string
  sortable?: boolean
  sortType?: SortType | 'none'
  fixed?: boolean
  width?: number
}

export interface ClientSortOptions {
  sortBy: string | string[]
  sortDesc: boolean | boolean[]
}

export type ClickEventType = 'single' | 'double'

export type MultipleSelectStatus = 'allSelected' | 'noneSelected' | 'partSelected'

export type EmitsEventName = 'clickRow' | 'selectRow' | 'deselectRow' | 'expandRow' | 'updateSort' | 'update:itemsSelected' | 'update:serverOptions' | 'updateFilter' | 'updatePageItems' | 'updateTotalItems' | 'selectAll'
