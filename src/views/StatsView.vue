<template>
  <div class="stats-page">
    <header class="header">
      <button class="arrow-btn" @click="changeYear(-1)">‹</button>
      <h2 class="month-title">{{ currentYear }}年</h2>
      <button class="arrow-btn" @click="changeYear(1)">›</button>
    </header>

    <div class="card total-card">
      <div class="total-label">本年总花费</div>
      <div class="total-value">¥{{ yearTotal.toFixed(2) }}</div>
    </div>

    <div class="card">
      <h3>月度分布</h3>
      <div class="monthly-bars">
        <div v-for="(m, index) in monthlyData" :key="index" class="bar-row">
          <span class="m-label">{{ index + 1 }}月</span>
          <div class="bar-bg">
            <div class="bar-fill" :style="{ width: getBarWidth(m.total) }"></div>
          </div>
          <span class="m-val">¥{{ m.total }}</span>
        </div>
      </div>
    </div>

    <!-- 暂时没做点击切月，这里显示所选年 10 月（或当前月）的分类作为示例 -->
    <div class="card">
      <h3>分类明细 ({{ currentMonth }}月)</h3>
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
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { statsRepo } from '../services/mealRepo'

const currentDate = new Date()
const currentYear = ref(currentDate.getFullYear())
const currentMonth = ref(currentDate.getMonth() + 1) // 用来显示分类明细，默认当月

const monthlyData = ref([])
const yearTotal = ref(0)
const monthStats = ref(null)

const loadYearData = async () => {
  // 1. 获取12个月的总额
  monthlyData.value = await statsRepo.getYearMonthlyTotals(currentYear.value)

  // 2. 计算年总
  yearTotal.value = monthlyData.value.reduce((sum, m) => sum + m.total, 0)

  // 3. 获取当前选中月的详细分类
  const mStr = String(currentMonth.value).padStart(2, '0')
  monthStats.value = await statsRepo.getMonthStats(`${currentYear.value}-${mStr}`)
}

onMounted(loadYearData)
watch(currentYear, loadYearData)

const changeYear = (offset) => {
  currentYear.value += offset
}

// 计算条形图宽度 (百分比)
const getBarWidth = (amount) => {
  if (yearTotal.value === 0) return '0%'
  // 找一个最大值作为100%的基准，避免有些月金额太小看不见
  const maxVal = Math.max(...monthlyData.value.map((m) => m.total), 100)
  return `${(amount / maxVal) * 100}%`
}
</script>

<style scoped>
.stats-page {
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

.card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
.card h3 {
  margin-top: 0;
  font-size: 16px;
  color: #333;
  margin-bottom: 15px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.total-card {
  text-align: center;
}
.total-label {
  color: #666;
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
}
.m-label {
  width: 35px;
  color: #666;
}
.bar-bg {
  flex: 1;
  height: 12px;
  background: #f0f0f0;
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
  color: #333;
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
  color: #555;
  border-bottom: 1px dashed #eee;
  padding-bottom: 8px;
}
.cat-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
</style>
