<template>
  <div class="list-page">
    <header class="header">
      <button class="arrow-btn" @click="changeMonth(-1)">‹</button>
      <h2 class="month-title">{{ currentYear }}年{{ currentMonth }}月</h2>
      <button class="arrow-btn" @click="changeMonth(1)">›</button>
    </header>

    <div class="summary-bar">
      <span>本月总花费</span>
      <span class="total-amount">¥{{ monthTotal.toFixed(2) }}</span>
    </div>

    <div class="list-container">
      <div v-if="groupedData.length === 0" class="empty-state">
        这个月还没有记录哦~<br />点击右下角 + 开始记账吧！
      </div>

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

          <!-- 食材 -->
          <div
            v-for="ing in day.ingredients"
            :key="'i' + ing.id"
            class="record-item ingredient-item"
          >
            <span class="tag ing-tag">食材</span>
            <div class="ing-list">
              <span v-for="(item, idx) in ing.items" :key="idx" class="ing-item">
                {{ item.name }} ¥{{ item.amount }}
              </span>
            </div>
            <button class="del-icon edit-icon" @click="openEditForm('ingredient', ing)">✏️</button>
            <button class="del-icon" @click="deleteRecord('ingredient', ing.id)">×</button>
          </div>
        </div>
      </div>
    </div>

    <button class="fab-btn" @click="openAddForm">+</button>

    <!-- ================= 悬浮窗新增/修改表单 ================= -->
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

          <!-- 1. 三餐表单 -->
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

          <!-- 2. 额外表单 -->
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

          <!-- 3. 食材表单 -->
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
// 把 toRaw 加进去
import { ref, computed, onMounted, watch, toRaw } from 'vue'
import { mealRepo, extraRepo, ingredientRepo, statsRepo } from '../services/mealRepo'

const currentDate = new Date()
const currentYear = ref(currentDate.getFullYear())
const currentMonth = ref(currentDate.getMonth() + 1)

const rawMeals = ref([])
const rawExtras = ref([])
const rawIngredients = ref([])
const monthTotal = ref(0)
const expandedDates = ref([])

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

const groupedData = computed(() => {
  const map = new Map()
  const initDay = (date) => {
    if (!map.has(date)) map.set(date, { date, meals: [], extras: [], ingredients: [], total: 0 })
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
  rawIngredients.value.forEach((i) => {
    const day = initDay(i.date)
    day.ingredients.push(i)
    i.items.forEach((item) => {
      day.total += item.amount
    })
  })
  return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date))
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

// ================= 删除 =================
const deleteRecord = async (type, id) => {
  if (!confirm('确定删除这条记录吗？')) return
  if (type === 'meal') await mealRepo.deleteMeal(id)
  if (type === 'extra') await extraRepo.deleteExtra(id)
  if (type === 'ingredient') await ingredientRepo.deleteIngredient(id)
  loadData()
}

// ================= 新增 / 修改逻辑 =================
const showForm = ref(false)
const formType = ref('meal')
const editingId = ref(null) // 记录当前是不是在修改状态

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
  editingId.value = null // 清空修改状态
  formData.value = initFormData()
  showForm.value = true
}

const openEditForm = (type, record) => {
  formType.value = type
  editingId.value = record.id
  formData.value = JSON.parse(JSON.stringify(record)) // 深拷贝，防止直接修改页面数据
  showForm.value = true
}

watch(formType, () => {
  // 如果正在修改，切换 tab 就不重置表单了（防止用户误触丢失数据）
  if (!editingId.value) {
    formData.value = initFormData()
  }
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

      // 👇 使用 toRaw 彻底剥离 Vue 的响应式代理
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
      // 食材部分也用 toRaw
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

    if (!expandedDates.value.includes(formData.value.date)) {
      expandedDates.value.push(formData.value.date)
    }
  } catch (error) {
    console.error('保存出错详细信息:', error)
    alert('保存失败原因：' + (error.message || JSON.stringify(error)))
  }
}
</script>

<style scoped>
/* 头部样式 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #fff;
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
}
.summary-bar {
  display: flex;
  justify-content: space-between;
  padding: 10px 20px;
  background: #fff;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
  color: #666;
  font-size: 14px;
}
.total-amount {
  font-size: 18px;
  font-weight: bold;
  color: #ff5722;
}
.list-container {
  padding: 10px;
}
.empty-state {
  text-align: center;
  color: #999;
  margin-top: 50px;
  line-height: 1.8;
}
.day-group {
  background: #fff;
  border-radius: 8px;
  margin-bottom: 10px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
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
}
.weekday {
  font-size: 12px;
  color: #999;
}
.day-amount {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
}
.expand-icon {
  font-size: 12px;
  color: #999;
}
.day-details {
  padding: 5px 15px 15px;
  background: #fafafa;
}
.record-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
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
.ing-tag {
  background: #c8e6c9;
  color: #2e7d32;
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
.edit-icon:hover {
  color: #ff9800;
}
.ing-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  flex: 1;
}
.ing-item {
  background: #fff;
  border: 1px solid #ddd;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
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

/* ======== 悬浮窗弹窗样式 ======== */
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
