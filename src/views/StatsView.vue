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

    <!-- 数据备份区 -->
    <div class="card backup-card">
      <h3>数据备份与导出</h3>
      <p class="tip">数据仅保存在当前浏览器，换手机或清缓存会丢失。JSON可恢复，CSV/TXT方便查看。</p>

      <div class="backup-actions">
        <button class="btn-json" @click="exportJSON">导出备份 (JSON)</button>
        <label class="btn-import">
          导入恢复
          <input type="file" accept=".json" @change="importData" style="display: none" />
        </label>
      </div>

      <div class="backup-actions" style="margin-top: 10px">
        <button class="btn-csv" @click="exportCSV">导出表格 (CSV)</button>
        <button class="btn-txt" @click="exportTXT">导出文本 (TXT)</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { statsRepo } from '../services/mealRepo'
import { db } from '../db/index'

const currentDate = new Date()
const currentYear = ref(currentDate.getFullYear())
const currentMonth = ref(currentDate.getMonth() + 1)

const monthlyData = ref([])
const yearTotal = ref(0)
const monthStats = ref(null)

const loadYearData = async () => {
  monthlyData.value = await statsRepo.getYearMonthlyTotals(currentYear.value)
  yearTotal.value = monthlyData.value.reduce((sum, m) => sum + m.total, 0)
  const mStr = String(currentMonth.value).padStart(2, '0')
  monthStats.value = await statsRepo.getMonthStats(`${currentYear.value}-${mStr}`)
}

onMounted(loadYearData)
watch(currentYear, loadYearData)

const changeYear = (offset) => {
  currentYear.value += offset
}

const getBarWidth = (amount) => {
  if (yearTotal.value === 0) return '0%'
  const maxVal = Math.max(...monthlyData.value.map((m) => m.total), 100)
  return `${(amount / maxVal) * 100}%`
}

// 通用下载函数
const downloadFile = (content, filename, type) => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const getTodayStr = () => new Date().toISOString().split('T')[0]

// 1. 导出 JSON
const exportJSON = async () => {
  try {
    const meals = await db.meals.toArray()
    const extras = await db.extras.toArray()
    const ingredients = await db.ingredients.toArray()
    const backupData = {
      version: 1,
      exportTime: new Date().toISOString(),
      data: { meals, extras, ingredients },
    }
    downloadFile(
      JSON.stringify(backupData, null, 2),
      `伙食记账备份_${getTodayStr()}.json`,
      'application/json',
    )
  } catch (e) {
    console.log(e)
    alert('JSON 导出失败')
  }
}

// 2. 导出 CSV (Excel可以打开)
const exportCSV = async () => {
  try {
    const meals = await db.meals.toArray()
    const extras = await db.extras.toArray()
    const ingredients = await db.ingredients.toArray()

    let csv = '\uFEFF日期,类型,大类,明细项,金额,标签,备注\n' // \uFEFF 防Excel乱码

    meals.forEach((m) => {
      csv += `${m.date},正餐,${m.type},,${m.amount},${m.tag || ''},${m.note || ''}\n`
    })
    extras.forEach((e) => {
      csv += `${e.date},额外,${e.type},,${e.amount},${e.tag || ''},${e.note || ''}\n`
    })
    ingredients.forEach((i) => {
      i.items.forEach((item) => {
        csv += `${i.date},食材,食材,${item.name},${item.amount},,\n`
      })
    })

    downloadFile(csv, `伙食记账表格_${getTodayStr()}.csv`, 'text/csv;charset=utf-8')
  } catch (e) {
    console.log(e)
    alert('CSV 导出失败')
  }
}

// 3. 导出 TXT
const exportTXT = async () => {
  try {
    const meals = await db.meals.toArray()
    const extras = await db.extras.toArray()
    const ingredients = await db.ingredients.toArray()

    let txt = `伙食记账文本备份 - ${new Date().toLocaleString()}\n\n`

    meals.forEach((m) => {
      txt += `[正餐] ${m.date} ${m.type} - ¥${m.amount} (${m.tag || ''} ${m.note || ''})\n`
    })
    extras.forEach((e) => {
      txt += `[额外] ${e.date} ${e.type} - ¥${e.amount} (${e.tag || ''} ${e.note || ''})\n`
    })
    ingredients.forEach((i) => {
      txt += `[食材] ${i.date} - `
      i.items.forEach((item) => {
        txt += `${item.name}:¥${item.amount} `
      })
      txt += '\n'
    })

    downloadFile(txt, `伙食记账文本_${getTodayStr()}.txt`, 'text/plain;charset=utf-8')
  } catch (e) {
    console.log(e)
    alert('TXT 导出失败')
  }
}

// 4. 导入 JSON
const importData = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const backupData = JSON.parse(e.target.result)
      if (!backupData.data || !backupData.data.meals) return alert('文件格式不正确')
      if (!confirm('导入将会覆盖当前所有数据，确定继续吗？')) return

      await db.transaction('rw', db.meals, db.extras, db.ingredients, async () => {
        await db.meals.clear()
        await db.extras.clear()
        await db.ingredients.clear()
        await db.meals.bulkAdd(backupData.data.meals)
        await db.extras.bulkAdd(backupData.data.extras)
        await db.ingredients.bulkAdd(backupData.data.ingredients)
      })
      alert('导入成功！')
      loadYearData()
    } catch (e) {
      console.log(e)
      alert('导入失败，文件可能已损坏')
    }
  }
  reader.readAsText(file)
  event.target.value = ''
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

.backup-card {
  margin-top: 20px;
}
.tip {
  font-size: 12px;
  color: #888;
  margin-bottom: 15px;
  line-height: 1.5;
}
.backup-actions {
  display: flex;
  gap: 10px;
}
.backup-actions button,
.btn-import {
  flex: 1;
  padding: 10px;
  text-align: center;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  cursor: pointer;
  font-weight: bold;
}
.btn-json {
  background: #4caf50;
  color: white;
}
.btn-import {
  background: #ff9800;
  color: white;
  display: inline-block;
}
.btn-csv {
  background: #2196f3;
  color: white;
}
.btn-txt {
  background: #9e9e9e;
  color: white;
}
</style>
