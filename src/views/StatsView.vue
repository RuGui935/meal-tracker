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

    <div class="card backup-card">
      <h3>数据备份与导出</h3>
      <p class="tip">数据仅保存在当前浏览器，换手机或清缓存会丢失。JSON可恢复，CSV/TXT方便查看。</p>
      <div class="backup-actions">
        <button class="btn-json" @click="exportJSON">导出备份 (JSON)</button>
        <label class="btn-import"
          >导入恢复<input type="file" accept=".json" @change="onFileSelect" style="display: none"
        /></label>
      </div>
      <div class="backup-actions" style="margin-top: 10px">
        <button class="btn-csv" @click="exportCSV">导出表格 (CSV)</button>
        <button class="btn-txt" @click="exportTXT">导出文本 (TXT)</button>
      </div>
    </div>

    <!-- 👇 自定义导入弹窗 -->
    <div v-if="importModal.show" class="modal-overlay">
      <div class="modal-content import-modal">
        <button class="close-btn" @click="cancelImport">✕</button>
        <h3>导入数据</h3>
        <p class="modal-desc">请选择导入方式：</p>
        <div class="modal-actions">
          <button class="btn-append" @click="doImport(true)">追加 (保留旧数据)</button>
          <button class="btn-overwrite" @click="doImport(false)">覆盖 (清空旧数据)</button>
          <button class="btn-cancel" @click="cancelImport">取消导入</button>
        </div>
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
const selectedMonth = ref(currentDate.getMonth() + 1)

const monthlyData = ref([])
const yearTotal = ref(0)
const monthStats = ref(null)

const loadYearData = async () => {
  monthlyData.value = await statsRepo.getYearMonthlyTotals(currentYear.value)
  yearTotal.value = monthlyData.value.reduce((sum, m) => sum + m.total, 0)
  await loadMonthDetails()
}

const loadMonthDetails = async () => {
  const mStr = String(selectedMonth.value).padStart(2, '0')
  monthStats.value = await statsRepo.getMonthStats(`${currentYear.value}-${mStr}`)
}

onMounted(loadYearData)
watch(currentYear, loadYearData)

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

// ================= 导出 =================
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

const exportCSV = async () => {
  try {
    const meals = await db.meals.toArray()
    const extras = await db.extras.toArray()
    const ingredients = await db.ingredients.toArray()
    let csv = '\uFEFF日期,类型,大类,明细项,金额,标签,备注\n'
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

// ================= 导入逻辑 =================
const importModal = ref({ show: false, data: null })

// 选择文件后，暂存数据，弹出选择框
const onFileSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const backupData = JSON.parse(e.target.result)
      if (!backupData.data || !backupData.data.meals) {
        return alert('文件格式不正确')
      }
      importModal.value.data = backupData.data
      importModal.value.show = true
    } catch (err) {
      alert('解析失败，文件已损坏')
    }
  }
  reader.readAsText(file)
  event.target.value = '' // 允许重复选同一个文件
}

// 取消导入
const cancelImport = () => {
  importModal.value.show = false
  importModal.value.data = null
}

// 执行导入 (isAppend: true = 追加, false = 覆盖)
const doImport = async (isAppend) => {
  const data = importModal.value.data
  if (!data) return

  try {
    await db.transaction('rw', db.meals, db.extras, db.ingredients, async () => {
      if (!isAppend) {
        await db.meals.clear()
        await db.extras.clear()
        await db.ingredients.clear()
      }

      // 1. 三餐
      for (const m of data.meals) {
        if (isAppend) {
          const exist = await db.meals
            .where({ date: m.date, type: m.type, amount: m.amount, note: m.note })
            .first()
          if (!exist) await db.meals.add(m)
        } else {
          await db.meals.add(m)
        }
      }

      // 2. 额外
      for (const ex of data.extras) {
        if (isAppend) {
          const exist = await db.extras
            .where({ date: ex.date, type: ex.type, amount: ex.amount, note: ex.note })
            .first()
          if (!exist) await db.extras.add(ex)
        } else {
          await db.extras.add(ex)
        }
      }

      // 3. 食材
      for (const ing of data.ingredients) {
        if (isAppend) {
          const exist = await db.ingredients.where({ date: ing.date, note: ing.note }).first()
          if (!exist) await db.ingredients.add(ing)
        } else {
          await db.ingredients.add(ing)
        }
      }
    })

    alert(isAppend ? '追加导入成功！' : '覆盖导入成功！')
    cancelImport()
    loadYearData()
  } catch (err) {
    console.error(err)
    alert('导入失败')
  }
}
</script>

<style scoped>
/* 原有样式保持不变 */
.stats-page {
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
.backup-card {
  margin-top: 20px;
}
.tip {
  font-size: 12px;
  color: var(--sub-text);
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

/* 👇 新增弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}
.import-modal {
  background: var(--card-bg);
  width: 100%;
  max-width: 320px;
  border-radius: 16px;
  padding: 20px;
  position: relative;
  animation: scaleIn 0.2s ease-out;
}
@keyframes scaleIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
.import-modal h3 {
  margin-top: 0;
  text-align: center;
  color: var(--text-color);
  margin-bottom: 10px;
}
.close-btn {
  position: absolute;
  top: 10px;
  right: 15px;
  background: none;
  border: none;
  font-size: 20px;
  color: var(--sub-text);
  cursor: pointer;
}
.modal-desc {
  font-size: 13px;
  color: var(--sub-text);
  text-align: center;
  margin-bottom: 20px;
}
.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.modal-actions button {
  padding: 12px;
  border-radius: 8px;
  border: none;
  font-size: 15px;
  cursor: pointer;
  font-weight: bold;
}
.btn-append {
  background: #4caf50;
  color: white;
}
.btn-overwrite {
  background: #f44336;
  color: white;
}
.btn-cancel {
  background: rgba(128, 128, 128, 0.1);
  color: var(--sub-text);
}
</style>
