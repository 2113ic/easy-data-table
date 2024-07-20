import DataTable from './components/DataTable.vue'

if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.createApp({}).component('EasyDataTable', DataTable)
}

export default DataTable
