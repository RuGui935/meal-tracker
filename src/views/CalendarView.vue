<template>
  <div class="calendar-page">
    <header class="header">
      <button class="arrow-btn" @click="changeMonth(-1)">‹</button>
      <h2 class="month-title">{{ currentYear }}年{{ currentMonth }}月</h2>
      <button class="arrow-btn" @click="changeMonth(1)">›</button>
    </header>

    <div class="calendar-container">
      <!-- 星期表头 -->
      <div class="weekdays">
        <span v-for="day in ['一', '二', '三', '四', '五', '六', '日']" :key="day">{{ day }}</span>
      </div>

      <!-- 日期格子 -->
      <div class="days-grid">
        <!-- 补全前面的空白格 -->
        <div v-for="n in firstDayOffset" :key="'empty' + n" class="day-cell empty"></div>

        <!-- 真正的日期 -->
        <div
          v-for="day in daysInMonth"
          :key="day"
          class="day-cell"
          :class="{
            today: isToday(day),
            'has-record': recordedDates.includes(day),
          }"
        >
          <span class="day-num">{{ day }}</span>
          <!-- 有记录的打个勾 -->
          <span v-if="recordedDates.includes(day)" class="check-mark">✓</span>
        </div>
      </div>
    </div>

    <div class="legend">
      <span class="legend-item"><span class="dot"></span> 当日有记录</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { mealRepo, extraRepo, ingredientRepo } from '../services/mealRepo'

const currentDate = new Date()
const currentYear = ref(currentDate.getFullYear())
const currentMonth = ref(currentDate.getMonth() + 1)
const recordedDates = ref([])

const yearMonthStr = computed(() => {
  const m = String(currentMonth.value).padStart(2, '0')
  return `${currentYear.value}-${m}`
})

// 计算当前月第一天是星期几 (1-7, 周一为1)
const firstDayOffset = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value - 1, 1).getDay()
  return firstDay === 0 ? 6 : firstDay - 1 // 调整为周一开头
})

// 计算当前月有多少天
const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value, 0).getDate()
})

const loadData = async () => {
  // 去三张表里把所有有记录的日期捞出来，去重
  const meals = await mealRepo.getMealsByMonth(yearMonthStr.value)
  const extras = await extraRepo.getExtrasByMonth(yearMonthStr.value)
  const ings = await ingredientRepo.getIngredientsByMonth(yearMonthStr.value)

  const dates = new Set()
  meals.forEach((m) => dates.add(m.date))
  extras.forEach((e) => dates.add(e.date))
  ings.forEach((i) => dates.add(i.date))

  // 提取出纯日期的数字，比如 '2026-10-22' 变成 22
  recordedDates.value = Array.from(dates).map((d) => {
    const parts = d.split('-')
    return parseInt(parts[2])
  })
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
  background: #fff;
  border-radius: 8px;
  margin-bottom: 15px;
}
.arrow-btn {
  font-size: 24px;
  background: none;
  border: none;
  color: #333;
  cursor: pointer;
}
.month-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.calendar-container {
  background: #fff;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 12px;
  color: #999;
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
  background: #fff5f2;
  color: #ff5722;
}

.check-mark {
  position: absolute;
  bottom: 2px;
  right: 4px;
  font-size: 10px;
  color: #ff5722;
  font-weight: bold;
}

.legend {
  margin-top: 20px;
  text-align: center;
  font-size: 12px;
  color: #999;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
}
.dot {
  width: 8px;
  height: 8px;
  background: #fff5f2;
  border: 1px solid #ff5722;
  border-radius: 50%;
  display: inline-block;
}
</style>
