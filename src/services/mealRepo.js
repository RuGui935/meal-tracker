import { db } from '../db/index'

// ================= 1. 正餐 (早餐/午餐/晚餐) =================
export const mealRepo = {
  async addMeal(meal) { return await db.meals.add(meal) },
  async deleteMeal(id) { return await db.meals.delete(id) },
  async updateMeal(id, changes) { return await db.meals.update(id, changes) },
  async getMealsByDate(date) { return await db.meals.where('date').equals(date).toArray() },
  async getMealsByMonth(yearMonth) { return await db.meals.where('date').startsWith(yearMonth).toArray() }
}

// ================= 2. 额外记录 (奶茶/饮料/小吃/零食/水果) =================
export const extraRepo = {
  async addExtra(extra) { return await db.extras.add(extra) },
  async deleteExtra(id) { return await db.extras.delete(id) },
  async updateExtra(id, changes) { return await db.extras.update(id, changes) },
  async getExtrasByDate(date) { return await db.extras.where('date').equals(date).toArray() },
  async getExtrasByMonth(yearMonth) { return await db.extras.where('date').startsWith(yearMonth).toArray() }
}

// ================= 3. 食材记录 (多项明细) =================
export const ingredientRepo = {
  async addIngredient(ingredient) { return await db.ingredients.add(ingredient) },
  async deleteIngredient(id) { return await db.ingredients.delete(id) },
  async updateIngredient(id, changes) { return await db.ingredients.update(id, changes) },
  async getIngredientsByDate(date) { return await db.ingredients.where('date').equals(date).toArray() },
  async getIngredientsByMonth(yearMonth) { return await db.ingredients.where('date').startsWith(yearMonth).toArray() }
}

// ================= 4. 核心汇总计算 =================
export const statsRepo = {
  async getMonthStats(yearMonth) {
    const meals = await mealRepo.getMealsByMonth(yearMonth)
    const extras = await extraRepo.getExtrasByMonth(yearMonth)
    const ingredients = await ingredientRepo.getIngredientsByMonth(yearMonth)

    let stats = {
      total: 0, mealTotal: 0, extraTotal: 0, ingredientTotal: 0,
      extraDetail: { milkTea: 0, drink: 0, snack: 0, junk: 0, fruit: 0 }
    }

    meals.forEach(m => { stats.mealTotal += m.amount; stats.total += m.amount })
    extras.forEach(e => {
      stats.extraTotal += e.amount; stats.total += e.amount
      if (stats.extraDetail[e.type] !== undefined) stats.extraDetail[e.type] += e.amount
    })
    ingredients.forEach(ing => {
      let ingSum = 0
      ing.items.forEach(item => { ingSum += item.amount })
      stats.ingredientTotal += ingSum; stats.total += ingSum
    })
    return stats
  },

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
