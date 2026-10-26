import { createRouter, createWebHistory } from 'vue-router'
import ListView from '../views/ListView.vue'
import CalendarView from '../views/CalendarView.vue'
import StatsView from '../views/StatsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'list', component: ListView },
    { path: '/calendar', name: 'calendar', component: CalendarView },
    { path: '/stats', name: 'stats', component: StatsView }
  ]
})

export default router
