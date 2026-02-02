<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="链类型" prop="chainType">
        <el-select v-model="queryParams.chainType" placeholder="全部" clearable style="width: 140px">
          <el-option label="Ethereum" value="ETHEREUM" />
          <el-option label="BSC" value="BSC" />
          <el-option label="Tron" value="TRON" />
          <el-option label="Solana" value="SOLANA" />
        </el-select>
      </el-form-item>

      <el-form-item label="交易类型" prop="transactionType">
        <el-select v-model="queryParams.transactionType" placeholder="全部" clearable style="width: 140px">
          <el-option label="USDT归集" value="USDT_TRANSFER" />
          <el-option label="Gas充值" value="GAS_TRANSFER" />
        </el-select>
      </el-form-item>

      <el-form-item label="状态" prop="transactionStatus">
        <el-select v-model="queryParams.transactionStatus" placeholder="全部" clearable style="width: 120px">
          <el-option label="成功" value="SUCCESS" />
          <el-option label="失败" value="FAILED" />
          <el-option label="进行中" value="PENDING" />
        </el-select>
      </el-form-item>

      <el-form-item label="关键词" prop="keyword">
        <el-input
            v-model="queryParams.keyword"
            placeholder="哈希 / 转出 / 转入地址"
            clearable
            style="width: 240px"
            @keyup.enter="handleQuery"
        />
      </el-form-item>

      <el-form-item label="时间范围" style="width: 308px">
        <el-date-picker
            v-model="dateRange"
            type="daterange"
            value-format="YYYY-MM-DD HH:mm:ss"
            range-separator="-"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="20" class="mb-4">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <div class="card-header">
              <span>💰 归集总金额 (USDT)</span>
            </div>
          </template>
          <div class="card-value text-success">{{ summary.totalUsdtCollected || '0' }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <div class="card-header">
              <span>📉 订单总损耗 (USDT)</span>
            </div>
          </template>
          <div class="card-value text-danger">{{ summary.totalOrderLoss || '0' }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <div class="card-header">
              <span>📈 预估利润 (1%)</span>
            </div>
          </template>
          <div class="card-value text-primary">{{ summary.estimatedProfit || '0' }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <div class="card-header">
              <span>✅ 成功率</span>
            </div>
          </template>
          <div class="card-value">{{ summary.successRate || '0.00%' }}</div>
          <div class="card-sub">总笔数: {{ summary.totalTxCount || 0 }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-table v-loading="loading" :data="tableList" stripe>
      <el-table-column label="链" align="center" width="100" prop="chainType">
        <template #default="scope">
          <el-tag :type="getChainTagType(scope.row.chainType)">{{ scope.row.chainType }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="类型" align="center" width="120" prop="transactionType">
        <template #default="scope">
          <el-tag v-if="scope.row.transactionType === 'USDT_TRANSFER'" type="success" effect="plain">USDT归集</el-tag>
          <el-tag v-else type="warning" effect="plain">Gas充值</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="订单金额" align="right" width="120" prop="orderAmount">
        <template #default="scope">
          {{ scope.row.orderAmount || '-' }}
        </template>
      </el-table-column>

      <el-table-column label="订单损耗 (USDT)" align="right" width="140" prop="orderLoss">
        <template #default="scope">
          <span v-if="scope.row.transactionType === 'USDT_TRANSFER' && scope.row.orderLoss != null"
                :style="{
                  color: Number(scope.row.orderLoss) > 0 ? '#F56C6C' : '#67C23A',
                  fontWeight: 'bold'
                }">
            {{ Number(scope.row.orderLoss) > 0 ? '+' : '' }}{{ scope.row.orderLoss }}
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>

      <el-table-column label="热钱包支出" align="right" width="140">
        <template #default="scope">
    <span v-if="scope.row.transactionType === 'GAS_TRANSFER' && scope.row.hotWalletExpenditure">
      {{ scope.row.hotWalletExpenditure }}
    </span>
          <span v-else>-</span>
        </template>
      </el-table-column>

      <el-table-column label="滞留Gas" align="right" width="140">
        <template #default="scope">
    <span v-if="scope.row.transactionType === 'USDT_TRANSFER' && scope.row.strandedGas"
          :style="{ color: scope.row.strandedGas > 0 ? '#F56C6C' : '#909399' }">
      {{ scope.row.strandedGas }}
    </span>
          <span v-else>-</span>
        </template>
      </el-table-column>

      <el-table-column label="归集数量 (USDT)" align="right" width="150" prop="tokenAmount">
        <template #default="scope">
          <span v-if="scope.row.tokenAmount" style="font-weight: bold; color: #67C23A">
            +{{ scope.row.tokenAmount }}
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>

      <el-table-column label="状态" align="center" width="100" prop="transactionStatus">
        <template #default="scope">
          <el-tag v-if="scope.row.transactionStatus === 'SUCCESS'" type="success">成功</el-tag>
          <el-tag v-else-if="scope.row.transactionStatus === 'FAILED'" type="danger">失败</el-tag>
          <el-tag v-else type="info">进行中</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="交易哈希" align="center" min-width="180" show-overflow-tooltip>
        <template #default="scope">
          <el-link type="primary" :underline="false" :href="getScanUrl(scope.row.chainType, scope.row.transactionHash)" target="_blank">
            {{ formatHash(scope.row.transactionHash) }}
          </el-link>
        </template>
      </el-table-column>

      <el-table-column label="转出地址" align="center" min-width="150" show-overflow-tooltip>
        <template #default="scope">{{ formatHash(scope.row.fromAddress) }}</template>
      </el-table-column>

      <el-table-column label="转入地址" align="center" min-width="150" show-overflow-tooltip>
        <template #default="scope">{{ formatHash(scope.row.toAddress) }}</template>
      </el-table-column>

      <el-table-column label="时间" align="center" prop="createTime" width="160" />
    </el-table>

    <pagination
        v-show="total > 0"
        :total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
    />
  </div>
</template>

<script setup name="CollectionReport">
import { ref, reactive, toRefs, onMounted } from 'vue';
import { getCollectionReport } from '@/api/cashier/collection'; // 引入你刚才写的API文件

const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);
const dateRange = ref([]);

// 响应式数据
const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    chainType: undefined,
    transactionType: undefined,
    transactionStatus: undefined,
    keyword: undefined,
    startTime: undefined,
    endTime: undefined
  },
  summary: {
    totalUsdtCollected: 0,
    totalGasCostUsd: 0,
    totalTxCount: 0,
    profitRate: '0.00%',
    successRate: '0.00%'
  },
  tableList: [],
});

const { queryParams, summary, tableList } = toRefs(data);

/** 查询列表 */
function getList() {
  loading.value = true;
  // 处理时间范围参数
  if (dateRange.value && dateRange.value.length === 2) {
    queryParams.value.startTime = dateRange.value[0];
    queryParams.value.endTime = dateRange.value[1];
  } else {
    queryParams.value.startTime = undefined;
    queryParams.value.endTime = undefined;
  }

  getCollectionReport(queryParams.value).then(response => {
    // 你的ResultDTO结构是 { code, data: { summary, tableData }, ... }
    const resData = response.data;

    // 赋值统计数据
    if (resData.summary) {
      summary.value = resData.summary;
    }

    // 赋值表格数据
    if (resData.tableData) {
      tableList.value = resData.tableData.list; // PageHelper返回的是 list
      total.value = resData.tableData.total;
    } else {
      tableList.value = [];
      total.value = 0;
    }

    loading.value = false;
  }).catch(() => {
    loading.value = false;
  });
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  dateRange.value = [];
  queryParams.value = {
    pageNum: 1,
    pageSize: 10,
    chainType: undefined,
    transactionType: undefined,
    transactionStatus: undefined,
    keyword: undefined
  };
  handleQuery();
}

/** 辅助函数：获取不同链的Tag颜色 */
function getChainTagType(chain) {
  if (chain === 'ETHEREUM') return '';
  if (chain === 'BSC') return 'warning';
  if (chain === 'TRON') return 'danger';
  if (chain === 'SOLANA') return 'success';
  return 'info';
}

/** 辅助函数：哈希截断显示 */
function formatHash(hash) {
  if (!hash) return '-';
  if (hash.length < 12) return hash;
  return hash.substring(0, 6) + '...' + hash.substring(hash.length - 4);
}

/** 辅助函数：跳转浏览器 */
function getScanUrl(chain, hash) {
  if (!hash) return '#';
  switch (chain) {
    case 'ETHEREUM': return `https://etherscan.io/tx/${hash}`;
    case 'BSC': return `https://bscscan.com/tx/${hash}`;
    case 'TRON': return `https://tronscan.org/#/transaction/${hash}`;
    case 'SOLANA': return `https://solscan.io/tx/${hash}`;
    default: return '#';
  }
}

onMounted(() => {
  getList();
});
</script>

<style scoped>
.mb-4 {
  margin-bottom: 20px;
}

/* 统计卡片样式 */
.stat-card {
  text-align: center;
}
.card-header {
  font-weight: bold;
  font-size: 14px;
  color: #606266;
}
.card-value {
  font-size: 24px;
  font-weight: bold;
  margin: 10px 0;
}
.card-sub {
  font-size: 12px;
  color: #909399;
}
.text-success { color: #67C23A; }
.text-danger { color: #F56C6C; }
.text-primary { color: #409EFF; }
</style>