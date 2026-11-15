import { createRouter, createWebHashHistory } from 'vue-router'
import ListView from '../views/ListView.vue'
import CalendarView from '../views/CalendarView.vue'
import StatsView from '../views/StatsView.vue'
import SettingsView from '../views/SettingsView.vue' // 新增
import AchievementView from '../views/AchievementView.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'list', component: ListView },
    { path: '/calendar', name: 'calendar', component: CalendarView },
    { path: '/stats', name: 'stats', component: StatsView },
    { path: '/achievements', name: 'achievements', component: AchievementView },
    { path: '/settings', name: 'settings', component: SettingsView } // 新增
  ]
})

export default router
