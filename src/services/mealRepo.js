import { db } from '../db/index'

export const mealRepo = {
  async addMeal(meal) { return await db.meals.add(meal) },
  async deleteMeal(id) { return await db.meals.delete(Number(id)) },
  // 👇 核心修复：用 toArray().find() 配合 put 来更新，绝对不挑数据类型
  async updateMeal(id, changes) {
    const all = await db.meals.toArray()
    const target = all.find(item => String(item.id) === String(id))
    if (target) {
      await db.meals.put({ ...target, ...changes, id: target.id })
    }
  },
  async getMealsByMonth(yearMonth) { return await db.meals.where('date').startsWith(yearMonth).toArray() }
}

export const extraRepo = {
  async addExtra(extra) { return await db.extras.add(extra) },
  async deleteExtra(id) { return await db.extras.delete(Number(id)) },
  async updateExtra(id, changes) {
    const all = await db.extras.toArray()
    const target = all.find(item => String(item.id) === String(id))
    if (target) {
      await db.extras.put({ ...target, ...changes, id: target.id })
    }
  },
  async getExtrasByMonth(yearMonth) { return await db.extras.where('date').startsWith(yearMonth).toArray() }
}

export const ingredientRepo = {
  async addIngredient(ingredient) { return await db.ingredients.add(ingredient) },
  async deleteIngredient(id) { return await db.ingredients.delete(Number(id)) },
  async updateIngredient(id, changes) {
    const all = await db.ingredients.toArray()
    const target = all.find(item => String(item.id) === String(id))
    if (target) {
      await db.ingredients.put({ ...target, ...changes, id: target.id })
    }
  },
  async getIngredientsByMonth(yearMonth) { return await db.ingredients.where('date').startsWith(yearMonth).toArray() }
}

export const statsRepo = {
  async getMonthStats(yearMonth) {
    const meals = await mealRepo.getMealsByMonth(yearMonth)
    const extras = await extraRepo.getExtrasByMonth(yearMonth)
    const ingredients = await ingredientRepo.getIngredientsByMonth(yearMonth)
    let stats = { total: 0, mealTotal: 0, extraTotal: 0, ingredientTotal: 0, extraDetail: { milkTea: 0, drink: 0, snack: 0, junk: 0, fruit: 0 } }
    meals.forEach(m => { stats.mealTotal += m.amount; stats.total += m.amount })
    extras.forEach(e => {
      stats.extraTotal += e.amount; stats.total += e.amount
      if (stats.extraDetail[e.type] !== undefined) stats.extraDetail[e.type] += e.amount
    })
    ingredients.forEach(ing => {
      let ingSum = 0; ing.items.forEach(item => { ingSum += item.amount })
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
