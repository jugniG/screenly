import { listTodos, addTodo } from './todos'
import { listRules, createRule, updateRule, deleteRule, unlockChallenge, settleChallenge, beginStake, confirmStakePurchase } from './rules'
import { getTodayUsage, syncUsage } from './usage'
import { unlockHistory } from './unlock'
import { sendInvite, acceptInvite, declineInvite, removeFriend, listFriends, listInvites, syncSnapshot, getLeaderboard } from './leaderboard'

export default {
  listTodos,
  addTodo,
  listRules,
  createRule,
  updateRule,
  deleteRule,
  unlockChallenge,
  settleChallenge,
  beginStake,
  confirmStakePurchase,
  getTodayUsage,
  syncUsage,
  unlockHistory,
  sendInvite,
  acceptInvite,
  declineInvite,
  removeFriend,
  listFriends,
  listInvites,
  syncSnapshot,
  getLeaderboard,
}
