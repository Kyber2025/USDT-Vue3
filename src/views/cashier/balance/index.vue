<template>
  <div class="app-container">
    <el-card class="box-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="title">
            <el-icon class="icon-mr"><Wallet /></el-icon>多链钱包余额监控
          </span>
          <el-button
              type="primary"
              :icon="Refresh"
              :loading="reloading"
              @click="handleReload"
          >
            刷新链上余额
          </el-button>
        </div>
      </template>

      <el-table
          v-loading="loading"
          :data="balanceList"
          border
          style="width: 100%"
          stripe
      >
        <el-table-column label="公链" prop="chainType" width="100" align="center">
          <template #default="scope">
            <el-tag effect="dark" :type="getChainTagType(scope.row.chainType)">
              {{ scope.row.chainType }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="gas钱包资产" min-width="200" align="center">
          <template #default="scope">
            <div style="text-align: left; padding-left: 10px;">
              <div>
                <el-tag size="small" type="info">Gas</el-tag>
                <span style="font-weight: bold; margin-left: 5px; color: #E6A23C">
                  {{ scope.row.hotWalletUsdtNativeToken }}
                </span>
              </div>
              <div style="margin-top: 5px;">
                <el-tag size="small" type="success">USDT</el-tag>
                <span style="font-weight: bold; margin-left: 5px; color: #67C23A">
                  {{ scope.row.hotWalletUsdt }}
                </span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="gas钱包地址" prop="hotWalletAddress" min-width="300" align="center" show-overflow-tooltip>
          <template #default="scope">
            {{ scope.row.hotWalletAddress }}
            <el-icon
                class="copy-icon"
                @click="handleCopy(scope.row.hotWalletAddress)"
            ><CopyDocument /></el-icon>
          </template>
        </el-table-column>

        <el-table-column label="归集目的钱包余额" min-width="150" align="center">
          <template #default="scope">
             <span style="color: #409EFF; font-weight: bold;">
               {{ scope.row.collectWalletUsdt }} U
             </span>
          </template>
        </el-table-column>

      </el-table>
    </el-card>

    <div class="spacer"></div>

    <el-card class="box-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="title">
            <el-icon class="icon-mr"><Search /></el-icon>单地址实时查询工具
          </span>
        </div>
      </template>

      <el-form :inline="true" :model="queryForm" class="demo-form-inline">
        <el-form-item label="选择公链">
          <el-select v-model="queryForm.chainId" placeholder="请选择链" style="width: 150px">
            <el-option label="USDT-TRC20 (TRON)" value="728126428" />
            <el-option label="USDT-ERC20 (ETH)" value="1" />
            <el-option label="SOLANA" value="-1" />
            <el-option label="BSC" value="56" />
          </el-select>
        </el-form-item>
        <el-form-item label="钱包地址">
          <el-input
              v-model="queryForm.address"
              placeholder="请输入要查询的钱包地址"
              style="width: 400px"
              clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="success" :icon="Search" @click="handleSingleQuery" :loading="queryLoading">查询</el-button>
        </el-form-item>
      </el-form>

      <div v-if="singleResult" class="result-area">
        <el-descriptions title="查询结果" border :column="3">
          <el-descriptions-item label="链类型">
            <el-tag>{{ queryForm.chainId }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="查询地址">
            {{ queryForm.address }}
          </el-descriptions-item>
          <el-descriptions-item label="余额详情">
            <div v-for="(value, key) in singleResult" :key="key" class="balance-item">
              <span class="coin-name">{{ key }}:</span>
              <span class="coin-value">{{ value }}</span>
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>
  </div>
</template>

<script setup name="WalletBalance">
import { ref, onMounted, reactive } from 'vue'
import { listWalletBalance, reloadWalletBalance, getWalletBalanceByAddress } from '@/api/cashier/balance.js' // 引入刚才写的API
import { ElMessage } from 'element-plus'
import { Refresh, Search, CopyDocument, Wallet } from '@element-plus/icons-vue'
import useClipboard from 'vue-clipboard3'

// === 状态定义 ===
const loading = ref(false)
const reloading = ref(false)
const queryLoading = ref(false)
const balanceList = ref([]) // 列表数据

// 单个查询表单
const queryForm = reactive({
  chainId: '',
  address: ''
})
const singleResult = ref(null)

// 剪贴板工具
const { toClipboard } = useClipboard()

// === 方法定义 ===

// 1. 获取列表数据
const getList = async () => {
  loading.value = true
  try {
    const res = await listWalletBalance()
    // 假设后端返回的数据在 res.data 中，若依封装通常直接返回 data 或者 res.data
    // 请根据你的 request.js 响应拦截器调整，这里假设直接返回了 ResultDTO 的 data
    balanceList.value = res.data || []
  } catch (error) {
    console.error("获取余额失败", error)
  } finally {
    loading.value = false
  }
}

// 2. 刷新链上余额 (Reload)
const handleReload = async () => {
  reloading.value = true
  try {
    await reloadWalletBalance()
    ElMessage.success('刷新指令已发送，正在同步链上数据...')
    // 刷新后重新拉取列表
    await getList()
  } catch (error) {
    ElMessage.error('刷新失败')
  } finally {
    reloading.value = false
  }
}

// 3. 单地址查询
const handleSingleQuery = async () => {
  if (!queryForm.chainId || !queryForm.address) {
    ElMessage.warning('请填写链ID和地址')
    return
  }

  queryLoading.value = true
  singleResult.value = null // 清空旧结果

  try {
    const res = await getWalletBalanceByAddress(queryForm.chainId, queryForm.address)
    singleResult.value = res.data // 后端返回的是 Map<String, BigDecimal>
    ElMessage.success('查询成功')
  } catch (error) {
    ElMessage.error(error.msg || '查询失败，请检查地址是否正确')
  } finally {
    queryLoading.value = false
  }
}

// 4. 复制地址
const handleCopy = async (text) => {
  try {
    await toClipboard(text)
    ElMessage.success('地址已复制')
  } catch (e) {
    ElMessage.error('复制失败')
  }
}

// 5. 辅助：不同链显示不同颜色Tag
const getChainTagType = (chainId) => {
  if (!chainId) return 'info'
  const up = chainId.toUpperCase()
  if (up.includes('TRON')) return 'danger' // 红色
  if (up.includes('ETH')) return '' // 蓝色
  if (up.includes('BSC')) return 'warning' // 黄色
  if (up.includes('SOL')) return 'success' // 绿色
  return 'info'
}

// === 初始化 ===
onMounted(() => {
  getList()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: 100vh;
}

.box-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: bold;
  display: flex;
  align-items: center;
}

.icon-mr {
  margin-right: 8px;
}

.spacer {
  height: 20px;
}

.balance-text {
  font-weight: bold;
  color: #67c23a;
  font-size: 16px;
}

.copy-icon {
  cursor: pointer;
  margin-left: 8px;
  color: #409eff;
  font-size: 14px;
}
.copy-icon:hover {
  color: #66b1ff;
}

.result-area {
  margin-top: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 4px;
}

.balance-item {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}
.coin-name {
  font-weight: bold;
  margin-right: 10px;
  min-width: 60px;
}
.coin-value {
  color: #f56c6c;
  font-weight: bold;
}
</style>