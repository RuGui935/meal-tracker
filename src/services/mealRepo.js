import { db } from '../db/index'

// ================= 1. 正餐 (早餐/午餐/晚餐) =================
export const mealRepo = {
  // 增
  async addMeal(meal) {
    // meal: { date: '2026-10-22', type: 'lunch', amount: 12, tag: '外卖', note: '面', images: [] }
    return await db.meals.add(meal)
  },
  // 删
  async deleteMeal(id) {
    return await db.meals.delete(id)
  },
  // 改
  async updateMeal(id, changes) {
    return await db.meals.update(id, changes)
  },
  // 按日期查当天的正餐
  async getMealsByDate(date) {
    return await db.meals.where('date').equals(date).toArray()
  },
  // 按月查（传 '2026-10' 即可）
  async getMealsByMonth(yearMonth) {
    // Dexie 可以用 startsWith 查某个月
    return await db.meals.where('date').startsWith(yearMonth).toArray()
  }
}

// ================= 2. 额外记录 (奶茶/饮料/小吃/零食/水果) =================
export const extraRepo = {
  // 增
  async addExtra(extra) {
    // extra: { date: '2026-10-22', type: 'milkTea', amount: 8, tag: '蜜雪', note: '柠檬水', images: [] }
    return await db.extras.add(extra)
  },
  async deleteExtra(id) {
    return await db.extras.delete(id)
  },
  async updateExtra(id, changes) {
    return await db.extras.update(id, changes)
  },
  async getExtrasByDate(date) {
    return await db.extras.where('date').equals(date).toArray()
  },
  async getExtrasByMonth(yearMonth) {
    return await db.extras.where('date').startsWith(yearMonth).toArray()
  }
}

// ================= 3. 食材记录 (多项明细) =================
export const ingredientRepo = {
  // 增
  async addIngredient(ingredient) {
    // ingredient: { date: '2026-10-23', items: [{name:'青菜', amount:3.5}], note: '' }
    return await db.ingredients.add(ingredient)
  },
  async deleteIngredient(id) {
    return await db.ingredients.delete(id)
  },
  async updateIngredient(id, changes) {
    return await db.ingredients.update(id, changes)
  },
  async getIngredientsByDate(date) {
    return await db.ingredients.where('date').equals(date).toArray()
  },
  async getIngredientsByMonth(yearMonth) {
    return await db.ingredients.where('date').startsWith(yearMonth).toArray()
  }
}

// ================= 4. 核心汇总计算 =================
export const statsRepo = {
  // 计算某个月的所有花费（包含三餐 + 额外 + 食材），返回一个分类汇总对象
  async getMonthStats(yearMonth) {
    const meals = await mealRepo.getMealsByMonth(yearMonth)
    const extras = await extraRepo.getExtrasByMonth(yearMonth)
    const ingredients = await ingredientRepo.getIngredientsByMonth(yearMonth)

    let stats = {
      total: 0, // 当月总花费
      mealTotal: 0,
      extraTotal: 0,
      ingredientTotal: 0,
      extraDetail: { milkTea: 0, drink: 0, snack: 0, junk: 0, fruit: 0 } // 额外分类明细
    }

    // 算正餐
    meals.forEach(m => {
      stats.mealTotal += m.amount
      stats.total += m.amount
    })

    // 算额外
    extras.forEach(e => {
      stats.extraTotal += e.amount
      stats.total += e.amount
      if (stats.extraDetail[e.type] !== undefined) {
        stats.extraDetail[e.type] += e.amount
      }
    })

    // 算食材（注意食材是多条子项 items）
    ingredients.forEach(ing => {
      let ingSum = 0
      ing.items.forEach(item => { ingSum += item.amount })
      stats.ingredientTotal += ingSum
      stats.total += ingSum
    })

    return stats
  },

  // 计算某一年12个月的总额（用于统计页的柱状图/列表）
  // 这里为了简单，先循环12次查数据库，后期数据量大了可以优化为一次性查全年的数据再按月分组
  async getYearMonthlyTotals(year) {
    const result = []
    for (let i = 1; i <= 12; i++) {
      const monthStr = `${year}-${String(i).padStart(2, '0')}`
      const monthStats = await this.getMonthStats(monthStr)
      result.push({ month: i, total: monthStats.total })
    }
    return result
  }
}
