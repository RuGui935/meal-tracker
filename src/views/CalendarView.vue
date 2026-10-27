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
            'has-record': hasRecord(day) /* 👈 只要有三餐/额外就打勾 */,
            selected: selectedDay === day,
          }"
          @click="selectDay(day)"
        >
          <span class="day-num">{{ day }}</span>

          <!-- 图标展示逻辑 -->
          <span v-if="getDayStatus(day) === 'fire'" class="mark-icon fire">🔥</span>
          <span v-else-if="getDayStatus(day) === 'leaf'" class="mark-icon leaf">🍃</span>
          <span v-else-if="hasRecord(day)" class="mark-icon check">✓</span>
        </div>
      </div>
    </div>

    <div class="legend">
      <span class="legend-item"><span class="icon">✓</span> 正常记录</span>
      <span class="legend-item"><span class="icon">🔥</span> 花费>50</span>
      <span class="legend-item"><span class="icon">🍃</span> 花费≤10 (不含0元)</span>
    </div>

    <!-- 选中日期后的数据展示 -->
    <div v-if="selectedDay" class="day-detail-card">
      <div class="detail-header">
        <h3>{{ currentMonth }}月{{ selectedDay }}日 记录</h3>
        <span class="detail-total">总计 ¥{{ (dailyTotals[selectedDay] || 0).toFixed(2) }}</span>
      </div>

      <div v-if="selectedDayData.length === 0" class="empty-tip">这天没有任何记录</div>

      <div v-for="item in selectedDayData" :key="item.id" class="detail-item">
        <span class="detail-tag" :class="item.typeClass">{{ item.typeName }}</span>
        <span class="detail-note">{{ item.note }}</span>
        <span class="detail-amount">¥{{ item.amount }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { mealRepo, extraRepo, ingredientRepo } from '../services/mealRepo'

const currentDate = new Date()
const currentYear = ref(currentDate.getFullYear())
const currentMonth = ref(currentDate.getMonth() + 1)
const selectedDay = ref(null)

const rawMeals = ref([])
const rawExtras = ref([])
const rawIngredients = ref([])

const mealLabel = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' }
const extraLabel = { milkTea: '奶茶', drink: '饮料', snack: '小吃', junk: '零食', fruit: '水果' }

const yearMonthStr = computed(
  () => `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}`,
)

const firstDayOffset = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value - 1, 1).getDay()
  return firstDay === 0 ? 6 : firstDay - 1
})

const daysInMonth = computed(() => new Date(currentYear.value, currentMonth.value, 0).getDate())

// 总金额字典（用来显示在选中列表的顶部）
const dailyTotals = ref({})

const loadData = async () => {
  rawMeals.value = await mealRepo.getMealsByMonth(yearMonthStr.value)
  rawExtras.value = await extraRepo.getExtrasByMonth(yearMonthStr.value)
  rawIngredients.value = await ingredientRepo.getIngredientsByMonth(yearMonthStr.value)

  const totals = {}
  const add = (date, amount) => {
    const d = parseInt(date.split('-')[2])
    totals[d] = (totals[d] || 0) + amount
  }

  // 总额算上食材（只在点开某天看的时候显示）
  rawMeals.value.forEach((m) => add(m.date, m.amount))
  rawExtras.value.forEach((e) => add(e.date, e.amount))
  rawIngredients.value.forEach((i) => {
    let sum = 0
    i.items.forEach((item) => (sum += item.amount))
    add(i.date, sum)
  })

  dailyTotals.value = totals
}

watch(yearMonthStr, () => {
  selectedDay.value = null
  loadData()
})
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

const selectDay = (day) => {
  selectedDay.value = selectedDay.value === day ? null : day
}

// 👇 1. 判断这天是否有打勾资格（只看三餐和额外，不看食材）
const hasRecord = (day) => {
  const dateStr = `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const hasMeal = rawMeals.value.some((m) => m.date === dateStr)
  const hasExtra = rawExtras.value.some((e) => e.date === dateStr)
  return hasMeal || hasExtra
}

// 👇 2. 计算火/叶状态（只算三餐和额外的真金白银，0元不参与）
const getDayStatus = (day) => {
  const dateStr = `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  let realMoneySpent = 0
  rawMeals.value
    .filter((m) => m.date === dateStr)
    .forEach((m) => {
      realMoneySpent += m.amount
    })
  rawExtras.value
    .filter((e) => e.date === dateStr)
    .forEach((e) => {
      realMoneySpent += e.amount
    })

  if (realMoneySpent > 50) return 'fire'
  if (realMoneySpent > 0 && realMoneySpent <= 10) return 'leaf' // 👈 必须 > 0
  return 'normal'
}

// 生成选中日期的数据列表（包含食材）
const selectedDayData = computed(() => {
  if (!selectedDay.value) return []
  const dateStr = `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-${String(selectedDay.value).padStart(2, '0')}`
  const list = []

  rawMeals.value
    .filter((m) => m.date === dateStr)
    .forEach((m) => {
      list.push({
        id: 'm' + m.id,
        typeName: mealLabel[m.type],
        typeClass: 'meal',
        note: m.note || m.tag || '无备注',
        amount: m.amount,
      })
    })

  rawExtras.value
    .filter((e) => e.date === dateStr)
    .forEach((e) => {
      list.push({
        id: 'e' + e.id,
        typeName: extraLabel[e.type],
        typeClass: 'extra',
        note: e.tag || e.note || '无备注',
        amount: e.amount,
      })
    })

  rawIngredients.value
    .filter((i) => i.date === dateStr)
    .forEach((i) => {
      let total = 0
      i.items.forEach((item) => (total += item.amount))
      list.push({
        id: 'i' + i.id,
        typeName: '食材',
        typeClass: 'ing',
        note: i.items.map((item) => item.name).join('、'),
        amount: total.toFixed(2),
      })
    })

  return list
})
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
  cursor: pointer;
  transition: all 0.2s;
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
.day-cell.selected {
  border: 2px solid #ff9800;
  background: rgba(255, 152, 0, 0.2);
  font-weight: bold;
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

.day-detail-card {
  margin-top: 15px;
  background: var(--card-bg);
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  animation: fadeIn 0.3s;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px dashed rgba(128, 128, 128, 0.2);
  padding-bottom: 10px;
  margin-bottom: 10px;
}
.detail-header h3 {
  margin: 0;
  font-size: 15px;
  color: var(--text-color);
}
.detail-total {
  font-weight: bold;
  color: #ff5722;
}
.empty-tip {
  text-align: center;
  font-size: 13px;
  color: var(--sub-text);
  padding: 10px 0;
}
.detail-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  font-size: 14px;
  border-bottom: 1px dashed rgba(128, 128, 128, 0.1);
}
.detail-item:last-child {
  border-bottom: none;
}
.detail-tag {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  margin-right: 10px;
  background: rgba(128, 128, 128, 0.1);
  color: var(--sub-text);
}
.detail-tag.meal {
  background: rgba(128, 128, 128, 0.15);
  color: var(--text-color);
}
.detail-tag.extra {
  background: rgba(255, 152, 0, 0.15);
  color: #e65100;
}
.detail-tag.ing {
  background: rgba(46, 125, 50, 0.1);
  color: #2e7d32;
}
.detail-note {
  flex: 1;
  color: var(--text-color);
}
.detail-amount {
  font-family: monospace;
  font-weight: bold;
}
</style>
