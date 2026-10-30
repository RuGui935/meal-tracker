<template>
  <div class="settings-page">
    <h2 class="page-title">设置</h2>

    <!-- 外观设置 -->
    <div class="card">
      <h3>外观模式</h3>
      <div class="theme-options">
        <button :class="{ active: !isDark }" @click="setDark(false)">🌞 日间模式</button>
        <button :class="{ active: isDark }" @click="setDark(true)">🌙 夜间模式</button>
      </div>
    </div>

    <div class="card">
      <h3>卡片颜色 (主页顶部)</h3>
      <div class="color-options">
        <div
          v-for="(t, i) in themes"
          :key="i"
          class="color-dot"
          :style="{ background: t.bg }"
          :class="{ active: currentThemeIndex === i }"
          @click="setCardTheme(i)"
        ></div>
      </div>
    </div>

    <!-- 数据备份 -->
    <div class="card">
      <h3>数据备份与导出</h3>
      <p class="tip">数据仅保存在当前浏览器，换手机或清缓存会丢失。</p>
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

    <!-- 导入弹窗 (跟之前一样) -->
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
import { ref, computed } from 'vue'
import { db } from '../db/index'

// 主题配置 (跟 ListView 里保持一致)
const themes = [
  { name: '极光幻境', bg: 'linear-gradient(135deg, #0a192f 0%, #00b4db 60%, #a8ff78 100%)' },
  { name: '深海霓虹', bg: 'linear-gradient(135deg, #000428 0%, #004e92 60%, #00d2ff 100%)' },
  { name: '樱花晚霞', bg: 'linear-gradient(135deg, #d4145a 0%, #fbb03b 100%)' },
  { name: '赛博日落', bg: 'linear-gradient(135deg, #2b1055 0%, #7597de 50%, #ff7e5f 100%)' },
]

const isDark = ref(localStorage.getItem('theme') === 'dark')
const currentThemeIndex = ref(Number(localStorage.getItem('cardTheme')) || 0)

// 修改主题需要触发全局更新，我们用 localStorage 配合事件的简单方式
const setDark = (val) => {
  isDark.value = val
  localStorage.setItem('theme', val ? 'dark' : 'light')
  // 直接修改根节点的 class 触发全局颜色变化
  if (val) document.documentElement.classList.add('dark-mode')
  else document.documentElement.classList.remove('dark-mode')
}

const setCardTheme = (index) => {
  currentThemeIndex.value = index
  localStorage.setItem('cardTheme', index)
}

// 导出功能
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
}

const exportCSV = async () => {
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
}

const exportTXT = async () => {
  const meals = await db.meals.toArray()
  const extras = await db.extras.toArray()
  const ingredients = await db.ingredients.toArray()
  let txt = `伙食记账文本备份 - ${new Date().toLocaleString()}\n\n`
  meals.forEach((m) => {
    txt += `[正餐] ${m.date} ${m.type} - ¥${m.amount}\n`
  })
  extras.forEach((e) => {
    txt += `[额外] ${e.date} ${e.type} - ¥${e.amount}\n`
  })
  ingredients.forEach((i) => {
    txt += `[食材] ${i.date} - `
    i.items.forEach((item) => {
      txt += `${item.name}:¥${item.amount} `
    })
    txt += '\n'
  })
  downloadFile(txt, `伙食记账文本_${getTodayStr()}.txt`, 'text/plain;charset=utf-8')
}

// 导入逻辑
const importModal = ref({ show: false, data: null })

const onFileSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const backupData = JSON.parse(e.target.result)
      if (!backupData.data || !backupData.data.meals) return alert('文件格式不正确')
      importModal.value.data = backupData.data
      importModal.value.show = true
    } catch (err) {
      alert('解析失败')
    }
  }
  reader.readAsText(file)
  event.target.value = ''
}

const cancelImport = () => {
  importModal.value.show = false
  importModal.value.data = null
}

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
      let existMeals = isAppend ? await db.meals.toArray() : []
      let existExtras = isAppend ? await db.extras.toArray() : []
      let existIngredients = isAppend ? await db.ingredients.toArray() : []

      for (const m of data.meals) {
        if (isAppend) {
          const isDup = existMeals.some(
            (e) =>
              e.date === m.date && e.type === m.type && e.amount === m.amount && e.note === m.note,
          )
          if (!isDup) {
            await db.meals.add(m)
            existMeals.push(m)
          }
        } else await db.meals.add(m)
      }
      for (const ex of data.extras) {
        if (isAppend) {
          const isDup = existExtras.some(
            (e) =>
              e.date === ex.date &&
              e.type === ex.type &&
              e.amount === ex.amount &&
              e.note === ex.note,
          )
          if (!isDup) {
            await db.extras.add(ex)
            existExtras.push(ex)
          }
        } else await db.extras.add(ex)
      }
      for (const ing of data.ingredients) {
        if (isAppend) {
          const isDup = existIngredients.some((e) => e.date === ing.date && e.note === ing.note)
          if (!isDup) {
            await db.ingredients.add(ing)
            existIngredients.push(ing)
          }
        } else await db.ingredients.add(ing)
      }
    })
    alert(isAppend ? '追加导入成功！' : '覆盖导入成功！')
    cancelImport()
  } catch (err) {
    alert('导入失败：' + (err.message || '未知错误'))
  }
}
</script>

<style scoped>
.settings-page {
  padding: 15px;
}
.page-title {
  font-size: 20px;
  margin-bottom: 20px;
  color: var(--text-color);
}
.card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
.card h3 {
  margin-top: 0;
  font-size: 16px;
  color: var(--text-color);
  margin-bottom: 15px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.1);
  padding-bottom: 10px;
}

.theme-options {
  display: flex;
  gap: 10px;
}
.theme-options button {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  border: 2px solid transparent;
  background: rgba(128, 128, 128, 0.1);
  color: var(--text-color);
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}
.theme-options button.active {
  border-color: #ff5722;
  background: rgba(255, 87, 34, 0.1);
  color: #ff5722;
}

.color-options {
  display: flex;
  gap: 15px;
  justify-content: space-between;
}
.color-dot {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  cursor: pointer;
  border: 3px solid transparent;
  transition: transform 0.2s;
}
.color-dot.active {
  border-color: #fff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  transform: scale(1.1);
}

.tip {
  font-size: 12px;
  color: var(--sub-text);
  margin-bottom: 15px;
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

/* 弹窗 */
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
