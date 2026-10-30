<template>
  <div class="stats-page">
    <header class="header">
      <button class="arrow-btn" @click="changeYear(-1)">‹</button>
      <h2 class="month-title">{{ currentYear }}年</h2>
      <button class="arrow-btn" @click="changeYear(1)">›</button>
    </header>

    <!-- 本年总花费 -->
    <div class="card total-card">
      <div class="total-label">本年总花费</div>
      <div class="total-value">¥{{ yearTotal.toFixed(2) }}</div>
    </div>

    <!-- 月度分布 (点击切换月份) -->
    <div class="card">
      <h3>月度分布</h3>
      <div class="monthly-bars">
        <div
          v-for="(m, index) in monthlyData"
          :key="index"
          class="bar-row"
          :class="{ active: selectedMonth === index + 1 }"
          @click="selectMonth(index + 1)"
        >
          <span class="m-label">{{ index + 1 }}月</span>
          <div class="bar-bg">
            <div class="bar-fill" :style="{ width: getBarWidth(m.total) }"></div>
          </div>
          <span class="m-val">¥{{ m.total.toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <!-- 选中月份的分类明细 -->
    <div class="card">
      <h3>分类明细 ({{ selectedMonth }}月)</h3>
      <div v-if="monthStats" class="category-list">
        <div class="cat-item">
          <span>正餐</span><span>¥{{ monthStats.mealTotal.toFixed(2) }}</span>
        </div>
        <div class="cat-item">
          <span>奶茶</span><span>¥{{ monthStats.extraDetail.milkTea.toFixed(2) }}</span>
        </div>
        <div class="cat-item">
          <span>饮料</span><span>¥{{ monthStats.extraDetail.drink.toFixed(2) }}</span>
        </div>
        <div class="cat-item">
          <span>小吃</span><span>¥{{ monthStats.extraDetail.snack.toFixed(2) }}</span>
        </div>
        <div class="cat-item">
          <span>零食</span><span>¥{{ monthStats.extraDetail.junk.toFixed(2) }}</span>
        </div>
        <div class="cat-item">
          <span>水果</span><span>¥{{ monthStats.extraDetail.fruit.toFixed(2) }}</span>
        </div>
        <div class="cat-item">
          <span>食材</span><span>¥{{ monthStats.ingredientTotal.toFixed(2) }}</span>
        </div>
      </div>
      <div v-else class="empty-state">该月暂无数据</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { statsRepo } from '../services/mealRepo'

const currentDate = new Date()
const currentYear = ref(currentDate.getFullYear())
const selectedMonth = ref(currentDate.getMonth() + 1)

const monthlyData = ref([])
const yearTotal = ref(0)
const monthStats = ref(null)

// 加载整年数据
const loadYearData = async () => {
  monthlyData.value = await statsRepo.getYearMonthlyTotals(currentYear.value)
  yearTotal.value = monthlyData.value.reduce((sum, m) => sum + m.total, 0)

  // 初始加载时，加载默认选中的月份明细
  await loadMonthDetails()
}

// 加载单个月份的明细
const loadMonthDetails = async () => {
  const mStr = String(selectedMonth.value).padStart(2, '0')
  monthStats.value = await statsRepo.getMonthStats(`${currentYear.value}-${mStr}`)
}

onMounted(loadYearData)

// 切换年份时，重新加载全年数据和明细
watch(currentYear, async () => {
  await loadYearData()
})

// 点击哪个月，就更新选中状态并重新查该月数据
const selectMonth = async (month) => {
  selectedMonth.value = month
  await loadMonthDetails()
}

const changeYear = (offset) => {
  currentYear.value += offset
}

const getBarWidth = (amount) => {
  if (yearTotal.value === 0) return '0%'
  const maxVal = Math.max(...monthlyData.value.map((m) => m.total), 100)
  return `${(amount / maxVal) * 100}%`
}
</script>

<style scoped>
.stats-page {
  padding: 15px;
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

.card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: background 0.3s;
}
.card h3 {
  margin-top: 0;
  font-size: 16px;
  color: var(--text-color);
  margin-bottom: 15px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.1);
  padding-bottom: 10px;
}

.total-card {
  text-align: center;
}
.total-label {
  color: var(--sub-text);
  font-size: 14px;
  margin-bottom: 5px;
}
.total-value {
  font-size: 32px;
  font-weight: bold;
  color: #ff5722;
}

.monthly-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.bar-row {
  display: flex;
  align-items: center;
  font-size: 12px;
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  transition: all 0.2s;
}
.bar-row.active {
  background: rgba(255, 152, 0, 0.15);
  transform: scale(1.02);
}
.bar-row.active .m-label,
.bar-row.active .m-val {
  color: #ff9800;
  font-weight: bold;
}
.m-label {
  width: 35px;
  color: var(--sub-text);
}
.bar-bg {
  flex: 1;
  height: 12px;
  background: rgba(128, 128, 128, 0.1);
  border-radius: 6px;
  margin: 0 10px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  background: #ff9800;
  border-radius: 6px;
  transition: width 0.5s ease;
}
.m-val {
  width: 60px;
  text-align: right;
  font-family: monospace;
  color: var(--text-color);
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.cat-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: var(--text-color);
  border-bottom: 1px dashed rgba(128, 128, 128, 0.2);
  padding-bottom: 8px;
}
.cat-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.empty-state {
  text-align: center;
  color: var(--sub-text);
  font-size: 13px;
  padding: 10px 0;
}
</style>
