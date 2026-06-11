import { listTodos, addTodo } from './todos'
import { listRules, createRule, updateRule, deleteRule } from './rules'
import { getTodayUsage, syncUsage } from './usage'
import { freeUnlock, createCheckout, confirmPayment, unlockHistory } from './unlock'
import { createRemoveCheckout, confirmRemove } from './remove'

export default {
  listTodos,
  addTodo,
  listRules,
  createRule,
  updateRule,
  deleteRule,
  getTodayUsage,
  syncUsage,
  freeUnlock,
  createCheckout,
  confirmPayment,
  unlockHistory,
  createRemoveCheckout,
  confirmRemove,
}
