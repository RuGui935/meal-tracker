import { createRouter, createWebHashHistory } from 'vue-router'
import ListView from '../views/ListView.vue'
import CalendarView from '../views/CalendarView.vue'
import StatsView from '../views/StatsView.vue'
import SettingsView from '../views/SettingsView.vue' // 新增

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'list', component: ListView },
    { path: '/calendar', name: 'calendar', component: CalendarView },
    { path: '/stats', name: 'stats', component: StatsView },
    { path: '/settings', name: 'settings', component: SettingsView } // 新增
  ]
})

export default router
