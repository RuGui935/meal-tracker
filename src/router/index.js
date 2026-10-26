// 👈 注意这里导入的名字改了
import { createRouter, createWebHashHistory } from 'vue-router'
import ListView from '../views/ListView.vue'
import CalendarView from '../views/CalendarView.vue'
import StatsView from '../views/StatsView.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL), // 👈 改成 Hash 模式
  routes: [
    { path: '/', name: 'list', component: ListView },
    { path: '/calendar', name: 'calendar', component: CalendarView },
    { path: '/stats', name: 'stats', component: StatsView }
  ]
})

export default router
