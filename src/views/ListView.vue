<template>
  <div class="list-page">
    <!-- 1. 顶部月份切换 -->
    <header class="header">
      <button class="arrow-btn" @click="changeMonth(-1)">‹</button>
      <h2 class="month-title">{{ currentYear }}年{{ currentMonth }}月</h2>
      <button class="arrow-btn" @click="changeMonth(1)">›</button>
    </header>

    <!-- 2. 炫酷渐变卡片 (参考P2) -->
    <div class="summary-card">
      <div class="card-content">
        <div class="card-label">本月总花费</div>
        <div class="card-amount"><span class="currency">¥</span>{{ monthTotal.toFixed(2) }}</div>
      </div>
      <!-- 装饰性背景 -->
      <div class="card-bg-deco"></div>
    </div>

    <!-- 3. 居家食材专区（固定在每日记录上方） -->
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

    <!-- 4. 排序与每日记录列表 -->
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
          <!-- 三餐 -->
          <div v-for="meal in day.meals" :key="'m' + meal.id" class="record-item">
            <span class="tag">{{ mealLabel[meal.type] }}</span>
            <span class="note">{{ meal.note || meal.tag || '无备注' }}</span>
            <span class="amount">¥{{ meal.amount }}</span>
            <button class="del-icon edit-icon" @click="openEditForm('meal', meal)">✏️</button>
            <button class="del-icon" @click="deleteRecord('meal', meal.id)">×</button>
          </div>

          <!-- 额外 -->
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

    <button class="fab-btn" @click="openAddForm">+</button>

    <!-- 新增/修改 悬浮窗 -->
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
              <label>标签</label>
              <input type="text" v-model="formData.tag" list="meal-tags" placeholder="选或输入" />
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
              <label>牌子/标签</label>
              <input type="text" v-model="formData.tag" list="extra-tags" placeholder="选或输入" />
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
import { ref, computed, onMounted, watch, toRaw } from 'vue'
import { mealRepo, extraRepo, ingredientRepo, statsRepo } from '../services/mealRepo'

const currentDate = new Date()
const currentYear = ref(currentDate.getFullYear())
const currentMonth = ref(currentDate.getMonth() + 1)

const rawMeals = ref([])
const rawExtras = ref([])
const rawIngredients = ref([])
const monthTotal = ref(0)
const ingredientTotal = ref(0)
const expandedDates = ref([])

// 排序与置顶食材状态
const isDesc = ref(true) // 默认倒序
const showIngredients = ref(false)

const mealLabel = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' }
const extraLabel = { milkTea: '奶茶', drink: '饮料', snack: '小吃', junk: '零食', fruit: '水果' }

const yearMonthStr = computed(() => {
  const m = String(currentMonth.value).padStart(2, '0')
  return `${currentYear.value}-${m}`
})

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

// 置顶的食材列表（只包含当月食材）
const monthIngredients = computed(() => {
  return rawIngredients.value.sort((a, b) => b.date.localeCompare(a.date))
})

// 每日数据（排除掉了食材，因为食材单独拿出来了）
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
  // 根据 isDesc 排序
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

const getWeekday = (dateStr) => {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return days[new Date(dateStr).getDay()]
}

const deleteRecord = async (type, id) => {
  if (!confirm('确定删除这条记录吗？')) return
  if (type === 'meal') await mealRepo.deleteMeal(id)
  if (type === 'extra') await extraRepo.deleteExtra(id)
  if (type === 'ingredient') await ingredientRepo.deleteIngredient(id)
  loadData()
}

// ================= 表单逻辑 =================
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

      if (editingId.value) {
        await ingredientRepo.updateIngredient(editingId.value, ingData)
      } else {
        await ingredientRepo.addIngredient(ingData)
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
/* 头部 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: transparent;
  position: sticky;
  top: 0;
  z-index: 10;
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
  color: #333;
}

/* ======== 炫酷渐变卡片 ======== */
.summary-card {
  margin: 0 15px 15px;
  border-radius: 16px;
  background: linear-gradient(
    135deg,
    #2b2b45 0%,
    #3d2a4a 40%,
    #e69d8d 100%
  ); /* 参考P2的深紫到落日渐变 */
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
/* 卡片背景光晕装饰 */
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

/* ======== 食材置顶区 ======== */
.ingredient-section {
  margin: 0 15px 15px;
  background: #fff;
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
  background: #fcfcfc;
  border-bottom: 1px solid #f0f0f0;
}
.ing-title {
  font-size: 15px;
  font-weight: 600;
  color: #2e7d32;
}
.ing-total {
  font-size: 13px;
  color: #666;
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
  border-bottom: 1px dashed #eee;
  font-size: 13px;
}
.ing-record:last-child {
  border-bottom: none;
}
.ing-date {
  color: #999;
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
  background: #e8f5e9;
  color: #2e7d32;
  padding: 3px 8px;
  border-radius: 4px;
}

/* ======== 列表工具栏 ======== */
.list-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 15px 10px;
  font-size: 14px;
  color: #666;
}
.sort-btn {
  background: #fff;
  border: 1px solid #ddd;
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 12px;
  color: #ff5722;
  cursor: pointer;
  outline: none;
}

/* ======== 每日列表 ======== */
.list-container {
  padding: 0 15px;
}
.empty-state {
  text-align: center;
  color: #999;
  margin-top: 30px;
  line-height: 1.8;
}
.day-group {
  background: #fff;
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
  color: #333;
}
.weekday {
  font-size: 12px;
  color: #999;
}
.day-amount {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: #333;
}
.expand-icon {
  font-size: 12px;
  color: #ccc;
}
.day-details {
  padding: 5px 15px 15px;
  background: #fafafa;
  border-top: 1px solid #f5f5f5;
}
.record-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  font-size: 14px;
  border-bottom: 1px dashed #eee;
}
.record-item:last-child {
  border-bottom: none;
}
.tag {
  width: 40px;
  color: #666;
  font-size: 12px;
  background: #e0e0e0;
  text-align: center;
  border-radius: 4px;
  padding: 2px 0;
  margin-right: 10px;
  flex-shrink: 0;
}
.extra-tag {
  background: #ffe0b2;
  color: #e65100;
}
.note {
  flex: 1;
  color: #333;
  word-break: break-all;
}
.amount {
  font-family: monospace;
  font-weight: 600;
  margin-right: 10px;
  color: #333;
}
.del-icon {
  background: none;
  border: none;
  color: #ccc;
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
}
@media (max-width: 600px) {
  .fab-btn {
    right: 20px;
  }
}

/* ======== 弹窗样式 ======== */
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
  background: #fff;
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
  color: #333;
}
.type-tabs {
  display: flex;
  background: #f0f0f0;
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
  color: #666;
  cursor: pointer;
  transition: 0.2s;
}
.type-tabs button.active {
  background: #fff;
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
  color: #333;
  font-size: 14px;
}
.form-row input,
.form-row select {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  outline: none;
  background: #fafafa;
}
.form-row input:focus,
.form-row select:focus {
  border-color: #ff5722;
  background: #fff;
}
.ing-inputs {
  border: 1px dashed #ccc;
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
  background: #fff5f2;
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
  background: #f0f0f0;
  color: #666;
}
.save-btn {
  background: #ff5722;
  color: white;
  font-weight: bold;
}
</style>
