<template>
  <div class="calendar-page">
    <header class="header">
      <button class="arrow-btn" @click="changeMonth(-1)">‹</button>
      <h2 class="month-title">{{ currentYear }}年{{ currentMonth }}月</h2>
      <button class="arrow-btn" @click="changeMonth(1)">›</button>
    </header>

    <div class="calendar-container">
      <div class="weekdays">
        <span v-for="day in ['一', '二', '三', '四', '五', '六', '日']" :key="day">{{ day }}</span>
      </div>

      <div class="days-grid">
        <div v-for="n in firstDayOffset" :key="'empty' + n" class="day-cell empty"></div>

        <div
          v-for="day in daysInMonth"
          :key="day"
          class="day-cell"
          :class="{
            today: isToday(day),
            'has-record': dailyTotals[day] > 0,
          }"
        >
          <span class="day-num">{{ day }}</span>
          <!-- 特殊印记 -->
          <span v-if="dailyTotals[day] > 50" class="mark-icon fire">🔥</span>
          <span v-else-if="dailyTotals[day] > 0 && dailyTotals[day] <= 10" class="mark-icon leaf"
            >🍃</span
          >
          <span v-else-if="dailyTotals[day] > 0" class="mark-icon check">✓</span>
        </div>
      </div>
    </div>

    <div class="legend">
      <span class="legend-item"><span class="icon">✓</span> 正常记录</span>
      <span class="legend-item"><span class="icon">🔥</span> 花费>50</span>
      <span class="legend-item"><span class="icon">🍃</span> 花费≤10</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { mealRepo, extraRepo, ingredientRepo } from '../services/mealRepo'

const currentDate = new Date()
const currentYear = ref(currentDate.getFullYear())
const currentMonth = ref(currentDate.getMonth() + 1)
const dailyTotals = ref({}) // 存储每天的总花费 { '1': 20, '2': 5 }

const yearMonthStr = computed(
  () => `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}`,
)

const firstDayOffset = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value - 1, 1).getDay()
  return firstDay === 0 ? 6 : firstDay - 1
})

const daysInMonth = computed(() => new Date(currentYear.value, currentMonth.value, 0).getDate())

const loadData = async () => {
  const meals = await mealRepo.getMealsByMonth(yearMonthStr.value)
  const extras = await extraRepo.getExtrasByMonth(yearMonthStr.value)
  const ings = await ingredientRepo.getIngredientsByMonth(yearMonthStr.value)

  const totals = {}
  const add = (date, amount) => {
    const d = parseInt(date.split('-')[2])
    totals[d] = (totals[d] || 0) + amount
  }

  meals.forEach((m) => add(m.date, m.amount))
  extras.forEach((e) => add(e.date, e.amount))
  ings.forEach((i) => {
    let sum = 0
    i.items.forEach((item) => (sum += item.amount))
    add(i.date, sum)
  })

  dailyTotals.value = totals
}

watch(yearMonthStr, loadData)
onMounted(loadData)

const changeMonth = (offset) => {
  let newMonth = currentMonth.value + offset
  let newYear = currentYear.value
  if (newMonth > 12) {
    newMonth = 1
    newYear++
  }
  if (newMonth < 1) {
    newMonth = 12
    newYear--
  }
  currentYear.value = newYear
  currentMonth.value = newMonth
}

const isToday = (day) => {
  const today = new Date()
  return (
    today.getFullYear() === currentYear.value &&
    today.getMonth() + 1 === currentMonth.value &&
    today.getDate() === day
  )
}
</script>

<style scoped>
.calendar-page {
  padding: 10px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: var(--card-bg);
  border-radius: 8px;
  margin-bottom: 15px;
  transition: background 0.3s;
}
.arrow-btn {
  font-size: 24px;
  background: none;
  border: none;
  color: var(--text-color);
  cursor: pointer;
}
.month-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
}

.calendar-container {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: background 0.3s;
}
.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 12px;
  color: var(--sub-text);
  margin-bottom: 10px;
}
.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
}
.day-cell {
  position: relative;
  aspect-ratio: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  font-size: 16px;
  color: var(--text-color);
}
.day-cell.empty {
  background: transparent;
}
.day-cell.today {
  border: 2px solid #ff5722;
  font-weight: bold;
  color: #ff5722;
}
.day-cell.has-record {
  background: rgba(255, 87, 34, 0.1);
  color: #ff5722;
}

.mark-icon {
  position: absolute;
  bottom: 2px;
  right: 4px;
  font-size: 12px;
}
.mark-icon.check {
  color: #ff5722;
  font-weight: bold;
  font-size: 10px;
}

.legend {
  margin-top: 20px;
  font-size: 12px;
  color: var(--sub-text);
  display: flex;
  justify-content: center;
  gap: 15px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
