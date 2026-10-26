<template>
  <div class="list-page">
    <header class="header">
      <button class="arrow-btn" @click="changeMonth(-1)">‹</button>
      <h2 class="month-title">{{ currentYear }}年{{ currentMonth }}月</h2>
      <button class="arrow-btn" @click="changeMonth(1)">›</button>
    </header>

    <!-- 渐变卡片 -->
    <div class="summary-card">
      <div class="card-content">
        <div class="card-label">本月总花费</div>
        <div class="card-amount"><span class="currency">¥</span>{{ monthTotal.toFixed(2) }}</div>
      </div>
      <div class="card-bg-deco"></div>
    </div>

    <!-- 成就系统提示区 -->
    <div v-if="achievementMsg" class="achievement-toast">🏆 成就达成：{{ achievementMsg }}</div>

    <!-- 居家食材专区 -->
    <div class="ingredient-section" v-if="monthIngredients.length > 0">
      <div class="ingredient-header" @click="showIngredients = !showIngredients">
        <div class="ing-title">
          🛒 本月居家食材 <span class="ing-total">(¥{{ ingredientTotal.toFixed(2) }})</span>
        </div>
        <span class="expand-icon">{{ showIngredients ? '▼' : '▶' }}</span>
      </div>
      <div v-show="showIngredients" class="ingredient-details">
        <div v-for="ing in monthIngredients" :key="'top-i' + ing.id" class="ing-record">
          <span class="ing-date">{{ formatDate(ing.date) }}</span>
          <div class="ing-items">
            <span v-for="(item, idx) in ing.items" :key="idx" class="ing-tag">
              {{ item.name }} ¥{{ item.amount }}
            </span>
          </div>
          <button class="del-icon edit-icon" @click="openEditForm('ingredient', ing)">✏️</button>
          <button class="del-icon" @click="deleteRecord('ingredient', ing.id)">×</button>
        </div>
      </div>
    </div>

    <!-- 排序工具栏 -->
    <div class="list-toolbar">
      <span>每日明细</span>
      <button class="sort-btn" @click="toggleSort">
        {{ isDesc ? '最新在前 ↓' : '最早在前 ↑' }}
      </button>
    </div>

    <div class="list-container">
      <div v-if="groupedData.length === 0" class="empty-state">这个月还没有日常三餐记录哦~</div>

      <div v-for="day in groupedData" :key="day.date" class="day-group">
        <div class="day-header" @click="toggleExpand(day.date)">
          <div class="date-info">
            <span class="date-text">{{ formatDate(day.date) }}</span>
            <span class="weekday">{{ getWeekday(day.date) }}</span>
          </div>
          <div class="day-amount">
            <span>¥{{ day.total.toFixed(2) }}</span>
            <span class="expand-icon">{{ expandedDates.includes(day.date) ? '▼' : '▶' }}</span>
          </div>
        </div>

        <div v-show="expandedDates.includes(day.date)" class="day-details">
          <div v-for="meal in day.meals" :key="'m' + meal.id" class="record-item">
            <span class="tag">{{ mealLabel[meal.type] }}</span>
            <span class="note">{{ meal.note || meal.tag || '无备注' }}</span>
            <span class="amount">¥{{ meal.amount }}</span>
            <button class="del-icon edit-icon" @click="openEditForm('meal', meal)">✏️</button>
            <button class="del-icon" @click="deleteRecord('meal', meal.id)">×</button>
          </div>
          <div v-for="extra in day.extras" :key="'e' + extra.id" class="record-item">
            <span class="tag extra-tag">{{ extraLabel[extra.type] }}</span>
            <span class="note">{{ extra.tag || '' }} {{ extra.note }}</span>
            <span class="amount">¥{{ extra.amount }}</span>
            <button class="del-icon edit-icon" @click="openEditForm('extra', extra)">✏️</button>
            <button class="del-icon" @click="deleteRecord('extra', extra.id)">×</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 滚动隐藏按钮 -->
    <button class="fab-btn" :class="{ 'hide-fab': isScrollingDown }" @click="openAddForm">+</button>

    <!-- 弹窗 -->
    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal-content">
        <h3>{{ editingId ? '修改记录' : '记一笔' }}</h3>
        <div class="type-tabs">
          <button :class="{ active: formType === 'meal' }" @click="formType = 'meal'">三餐</button>
          <button :class="{ active: formType === 'extra' }" @click="formType = 'extra'">
            额外
          </button>
          <button :class="{ active: formType === 'ingredient' }" @click="formType = 'ingredient'">
            食材
          </button>
        </div>
        <div class="form-body">
          <div class="form-row">
            <label>日期</label>
            <input type="date" v-model="formData.date" />
          </div>
          <template v-if="formType === 'meal'">
            <div class="form-row">
              <label>餐次</label>
              <select v-model="formData.type">
                <option value="breakfast">早餐</option>
                <option value="lunch">午餐</option>
                <option value="dinner">晚餐</option>
              </select>
            </div>
            <div class="form-row">
              <label>金额</label
              ><input type="number" v-model="formData.amount" placeholder="0.00" />
            </div>
            <div class="form-row">
              <label>标签</label
              ><input type="text" v-model="formData.tag" list="meal-tags" placeholder="选或输入" />
              <datalist id="meal-tags">
                <option value="外卖"></option>
                <option value="家里吃"></option>
                <option value="出去吃"></option>
                <option value="食堂"></option>
              </datalist>
            </div>
            <div class="form-row">
              <label>备注</label
              ><input type="text" v-model="formData.note" placeholder="吃了什么" />
            </div>
          </template>
          <template v-if="formType === 'extra'">
            <div class="form-row">
              <label>类别</label>
              <select v-model="formData.type">
                <option value="milkTea">奶茶</option>
                <option value="drink">饮料</option>
                <option value="snack">小吃</option>
                <option value="junk">零食</option>
                <option value="fruit">水果</option>
              </select>
            </div>
            <div class="form-row">
              <label>金额</label
              ><input type="number" v-model="formData.amount" placeholder="0.00" />
            </div>
            <div class="form-row">
              <label>牌子/标签</label
              ><input type="text" v-model="formData.tag" list="extra-tags" placeholder="选或输入" />
              <datalist id="extra-tags">
                <option value="蜜雪冰城"></option>
                <option value="瑞幸"></option>
                <option value="霸王茶姬"></option>
                <option value="超市"></option>
                <option value="路边摊"></option>
              </datalist>
            </div>
            <div class="form-row">
              <label>备注</label
              ><input type="text" v-model="formData.note" placeholder="喝了/吃了啥" />
            </div>
          </template>
          <template v-if="formType === 'ingredient'">
            <div class="ing-inputs">
              <div v-for="(item, index) in formData.items" :key="index" class="form-row">
                <input type="text" v-model="item.name" placeholder="菜名" class="short-input" />
                <input type="number" v-model="item.amount" placeholder="金额" class="short-input" />
                <button class="del-btn" @click="removeIngItem(index)">×</button>
              </div>
              <button class="add-ing-btn" @click="addIngItem">+ 添加一项食材</button>
            </div>
          </template>
        </div>
        <div class="form-actions">
          <button class="cancel-btn" @click="showForm = false">取消</button>
          <button class="save-btn" @click="handleSave">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, toRaw } from 'vue'
import { mealRepo, extraRepo, ingredientRepo, statsRepo } from '../services/mealRepo'
import confetti from 'canvas-confetti' // 引入撒花

const currentDate = new Date()
const currentYear = ref(currentDate.getFullYear())
const currentMonth = ref(currentDate.getMonth() + 1)
const rawMeals = ref([])
const rawExtras = ref([])
const rawIngredients = ref([])
const monthTotal = ref(0)
const ingredientTotal = ref(0)
const expandedDates = ref([])
const isDesc = ref(true)
const showIngredients = ref(false)
const achievementMsg = ref('')

const mealLabel = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' }
const extraLabel = { milkTea: '奶茶', drink: '饮料', snack: '小吃', junk: '零食', fruit: '水果' }

const yearMonthStr = computed(
  () => `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}`,
)

const loadData = async () => {
  rawMeals.value = await mealRepo.getMealsByMonth(yearMonthStr.value)
  rawExtras.value = await extraRepo.getExtrasByMonth(yearMonthStr.value)
  rawIngredients.value = await ingredientRepo.getIngredientsByMonth(yearMonthStr.value)
  const stats = await statsRepo.getMonthStats(yearMonthStr.value)
  monthTotal.value = stats.total
  ingredientTotal.value = stats.ingredientTotal
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

const toggleSort = () => {
  isDesc.value = !isDesc.value
}

const monthIngredients = computed(() =>
  rawIngredients.value.sort((a, b) => b.date.localeCompare(a.date)),
)

const groupedData = computed(() => {
  const map = new Map()
  const initDay = (date) => {
    if (!map.has(date)) map.set(date, { date, meals: [], extras: [], total: 0 })
    return map.get(date)
  }
  rawMeals.value.forEach((m) => {
    const day = initDay(m.date)
    day.meals.push(m)
    day.total += m.amount
  })
  rawExtras.value.forEach((e) => {
    const day = initDay(e.date)
    day.extras.push(e)
    day.total += e.amount
  })
  const arr = Array.from(map.values())
  return arr.sort((a, b) =>
    isDesc.value ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date),
  )
})

const toggleExpand = (date) => {
  const index = expandedDates.value.indexOf(date)
  if (index > -1) expandedDates.value.splice(index, 1)
  else expandedDates.value.push(date)
}

const formatDate = (dateStr) => {
  const parts = dateStr.split('-')
  return `${parseInt(parts[1])}.${parseInt(parts[2])}`
}
const getWeekday = (dateStr) =>
  ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date(dateStr).getDay()]

const deleteRecord = async (type, id) => {
  if (!confirm('确定删除这条记录吗？')) return
  if (type === 'meal') await mealRepo.deleteMeal(id)
  if (type === 'extra') await extraRepo.deleteExtra(id)
  if (type === 'ingredient') await ingredientRepo.deleteIngredient(id)
  loadData()
}

// ================= 滚动隐藏 =================
const isScrollingDown = ref(false)
let lastScrollTop = 0
const handleScroll = () => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop
  if (scrollTop > lastScrollTop && scrollTop > 50) isScrollingDown.value = true
  else isScrollingDown.value = false
  lastScrollTop = scrollTop
}
onMounted(() => window.addEventListener('scroll', handleScroll))
onUnmounted(() => window.removeEventListener('scroll', handleScroll))

// ================= 表单与保存逻辑 =================
const showForm = ref(false)
const formType = ref('meal')
const editingId = ref(null)

const initFormData = () => {
  const today = new Date().toISOString().split('T')[0]
  if (formType.value === 'meal')
    return { date: today, type: 'lunch', amount: '', tag: '', note: '' }
  if (formType.value === 'extra')
    return { date: today, type: 'milkTea', amount: '', tag: '', note: '' }
  return { date: today, items: [{ name: '', amount: '' }] }
}

const formData = ref(initFormData())
const openAddForm = () => {
  formType.value = 'meal'
  editingId.value = null
  formData.value = initFormData()
  showForm.value = true
}
const openEditForm = (type, record) => {
  formType.value = type
  editingId.value = record.id
  formData.value = JSON.parse(JSON.stringify(record))
  showForm.value = true
}
watch(formType, () => {
  if (!editingId.value) formData.value = initFormData()
})

const addIngItem = () => {
  formData.value.items.push({ name: '', amount: '' })
}
const removeIngItem = (index) => {
  formData.value.items.splice(index, 1)
}

// 触发撒花与成就
const triggerCelebration = (amount, type) => {
  if (!editingId.value) {
    // 撒花特效
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.8 },
      colors: ['#ff5722', '#ff9800', '#4caf50'],
    })

    // 简单成就判断 (当天喝奶茶)
    if (type === 'extra' && formData.value.type === 'milkTea') {
      achievementMsg.value = '奶茶续命成功！🥤'
      setTimeout(() => {
        achievementMsg.value = ''
      }, 3000)
    }
  }
}

const handleSave = async () => {
  try {
    if (formType.value === 'meal' || formType.value === 'extra') {
      if (formData.value.amount === '' || formData.value.amount === null) return alert('请输入金额')
      const rawData = toRaw(formData.value)
      const data = {
        date: String(rawData.date),
        type: String(rawData.type),
        amount: Number(rawData.amount),
        tag: String(rawData.tag || ''),
        note: String(rawData.note || ''),
        images: rawData.images || [],
      }

      if (editingId.value) {
        if (formType.value === 'meal') await mealRepo.updateMeal(editingId.value, data)
        else await extraRepo.updateExtra(editingId.value, data)
      } else {
        if (formType.value === 'meal') await mealRepo.addMeal(data)
        else await extraRepo.addExtra(data)
        triggerCelebration(data.amount, formType.value) // 触发特效
      }
    } else {
      const rawData = toRaw(formData.value)
      const validItems = rawData.items
        .filter(
          (item) =>
            item.name && item.name.trim() !== '' && item.amount !== '' && item.amount !== null,
        )
        .map((item) => ({ name: String(item.name), amount: Number(item.amount) }))
      if (validItems.length === 0) return alert('请至少填写一项有效的食材')
      const ingData = {
        date: String(rawData.date),
        items: validItems,
        note: String(rawData.note || ''),
      }
      if (editingId.value) await ingredientRepo.updateIngredient(editingId.value, ingData)
      else {
        await ingredientRepo.addIngredient(ingData)
        triggerCelebration(0, 'ingredient')
      }
    }

    showForm.value = false
    editingId.value = null
    formData.value = initFormData()
    await loadData()
    if (!expandedDates.value.includes(formData.value.date))
      expandedDates.value.push(formData.value.date)
  } catch (error) {
    console.error(error)
    alert('保存失败：' + error.message)
  }
}
</script>

<style scoped>
/* 暗黑模式兼容的基础变量 */
:root {
  --bg-color: #f5f5f5;
  --card-bg: #fff;
  --text-color: #333;
  --sub-text: #999;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  position: sticky;
  top: 0;
  z-index: 10;
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

/* 卡片 */
.summary-card {
  margin: 0 15px 15px;
  border-radius: 16px;
  background: linear-gradient(135deg, #2b2b45 0%, #3d2a4a 40%, #e69d8d 100%);
  padding: 25px 20px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(61, 42, 74, 0.3);
  color: #fff;
}
.card-content {
  position: relative;
  z-index: 2;
}
.card-label {
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 5px;
}
.card-amount {
  font-size: 38px;
  font-weight: bold;
  font-family: -apple-system, sans-serif;
}
.currency {
  font-size: 22px;
  margin-right: 4px;
}
.card-bg-deco {
  position: absolute;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0) 70%);
  top: -50px;
  right: -20px;
  z-index: 1;
}

/* 成就弹窗 */
.achievement-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 152, 0, 0.9);
  color: #fff;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  z-index: 10000;
  animation: dropDown 0.3s ease-out;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
@keyframes dropDown {
  from {
    top: -50px;
    opacity: 0;
  }
  to {
    top: 20px;
    opacity: 1;
  }
}

/* 食材区 */
.ingredient-section {
  margin: 0 15px 15px;
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}
.ingredient-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  cursor: pointer;
  background: rgba(128, 128, 128, 0.05);
  border-bottom: 1px solid rgba(128, 128, 128, 0.1);
}
.ing-title {
  font-size: 15px;
  font-weight: 600;
  color: #2e7d32;
}
.ing-total {
  font-size: 13px;
  color: var(--sub-text);
  font-weight: normal;
  margin-left: 5px;
}
.ingredient-details {
  padding: 10px 15px;
}
.ing-record {
  display: flex;
  align-items: flex-start;
  padding: 8px 0;
  border-bottom: 1px dashed rgba(128, 128, 128, 0.2);
  font-size: 13px;
}
.ing-record:last-child {
  border-bottom: none;
}
.ing-date {
  color: var(--sub-text);
  width: 45px;
  flex-shrink: 0;
  margin-top: 2px;
}
.ing-items {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.ing-tag {
  background: rgba(46, 125, 50, 0.1);
  color: #2e7d32;
  padding: 3px 8px;
  border-radius: 4px;
}

/* 列表 */
.list-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 15px 10px;
  font-size: 14px;
  color: var(--sub-text);
}
.sort-btn {
  background: var(--card-bg);
  border: 1px solid rgba(128, 128, 128, 0.2);
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 12px;
  color: #ff5722;
  cursor: pointer;
  outline: none;
}
.list-container {
  padding: 0 15px;
}
.empty-state {
  text-align: center;
  color: var(--sub-text);
  margin-top: 30px;
  line-height: 1.8;
}
.day-group {
  background: var(--card-bg);
  border-radius: 12px;
  margin-bottom: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  cursor: pointer;
}
.date-info {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.date-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}
.weekday {
  font-size: 12px;
  color: var(--sub-text);
}
.day-amount {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: var(--text-color);
}
.expand-icon {
  font-size: 12px;
  color: var(--sub-text);
}
.day-details {
  padding: 5px 15px 15px;
  background: rgba(128, 128, 128, 0.03);
  border-top: 1px solid rgba(128, 128, 128, 0.1);
}
.record-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  font-size: 14px;
  border-bottom: 1px dashed rgba(128, 128, 128, 0.2);
}
.record-item:last-child {
  border-bottom: none;
}
.tag {
  width: 40px;
  color: var(--sub-text);
  font-size: 12px;
  background: rgba(128, 128, 128, 0.15);
  text-align: center;
  border-radius: 4px;
  padding: 2px 0;
  margin-right: 10px;
  flex-shrink: 0;
}
.extra-tag {
  background: rgba(255, 152, 0, 0.15);
  color: #e65100;
}
.note {
  flex: 1;
  color: var(--text-color);
  word-break: break-all;
}
.amount {
  font-family: monospace;
  font-weight: 600;
  margin-right: 10px;
  color: var(--text-color);
}
.del-icon {
  background: none;
  border: none;
  color: var(--sub-text);
  font-size: 18px;
  padding: 0 5px;
  cursor: pointer;
}
.del-icon:hover {
  color: #f44336;
}
.edit-icon {
  font-size: 14px;
  margin-right: 5px;
}

/* 悬浮按钮 */
.fab-btn {
  position: fixed;
  bottom: 75px;
  right: calc(50% - 280px);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #ff5722;
  color: white;
  font-size: 32px;
  border: none;
  box-shadow: 0 4px 10px rgba(255, 87, 34, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 100;
  transition: all 0.3s ease;
}
@media (max-width: 600px) {
  .fab-btn {
    right: 20px;
  }
}
.hide-fab {
  opacity: 0.1;
  transform: scale(0.7) translateY(20px);
  pointer-events: none;
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
.modal-content {
  background: var(--card-bg);
  width: 100%;
  max-width: 400px;
  border-radius: 16px;
  padding: 20px;
  box-sizing: border-box;
  max-height: 85vh;
  overflow-y: auto;
  animation: scaleIn 0.3s ease-out;
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
.modal-content h3 {
  margin-top: 0;
  text-align: center;
  color: var(--text-color);
}
.type-tabs {
  display: flex;
  background: rgba(128, 128, 128, 0.1);
  border-radius: 8px;
  padding: 4px;
  margin-bottom: 20px;
}
.type-tabs button {
  flex: 1;
  border: none;
  background: transparent;
  padding: 8px 0;
  font-size: 15px;
  border-radius: 6px;
  color: var(--sub-text);
  cursor: pointer;
  transition: 0.2s;
}
.type-tabs button.active {
  background: var(--card-bg);
  color: #ff5722;
  font-weight: bold;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
.form-row {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}
.form-row label {
  width: 70px;
  color: var(--text-color);
  font-size: 14px;
}
.form-row input,
.form-row select {
  flex: 1;
  padding: 10px;
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 6px;
  font-size: 16px;
  outline: none;
  background: rgba(128, 128, 128, 0.05);
  color: var(--text-color);
}
.form-row input:focus,
.form-row select:focus {
  border-color: #ff5722;
  background: var(--card-bg);
}
.ing-inputs {
  border: 1px dashed rgba(128, 128, 128, 0.3);
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 15px;
}
.ing-inputs .form-row {
  margin-bottom: 10px;
}
.short-input {
  width: 0;
}
.del-btn {
  background: none;
  border: none;
  color: #ff5722;
  font-size: 20px;
  padding: 0 10px;
  cursor: pointer;
}
.add-ing-btn {
  width: 100%;
  padding: 8px;
  border: 1px dashed #ff5722;
  background: rgba(255, 87, 34, 0.05);
  color: #ff5722;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}
.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 25px;
}
.form-actions button {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  border: none;
  font-size: 16px;
  cursor: pointer;
}
.cancel-btn {
  background: rgba(128, 128, 128, 0.1);
  color: var(--sub-text);
}
.save-btn {
  background: #ff5722;
  color: white;
  font-weight: bold;
}
</style>
