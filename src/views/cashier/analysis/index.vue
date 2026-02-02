<template>
  <div class="app-container">
    <el-card shadow="never" class="mb-2">
      <el-form :inline="true" :model="queryParams" ref="queryRef">
        <el-form-item label="统计时间" style="font-weight: bold">
          <el-date-picker
              v-model="dateRange"
              type="daterange"
              value-format="YYYY-MM-DD HH:mm:ss"
              range-separator="-"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
              style="width: 360px"
              @change="handleQuery"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">刷新数据</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span style="font-size: 16px; font-weight: bold">📊 各公链收支与损耗分析报表</span>
          <el-tag type="info" effect="plain" style="float: right">数据来源：链上实时统计</el-tag>
        </div>
      </template>

      <el-table
          v-loading="loading"
          :data="chainStatsList"
          border
          stripe
          show-summary
          :summary-method="getSummaries"
          style="width: 100%"
          :header-cell-style="{background:'#f5f7fa', color:'#606266'}"
      >
        <el-table-column type="index" label="#" width="50" align="center" />

        <el-table-column prop="chainType" label="公链网络" align="center" min-width="120">
          <template #default="scope">
            <el-tag :type="getChainTagType(scope.row.chainType)" effect="dark" size="large">
              {{ scope.row.chainType }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="totalOrderAmount" label="订单应收总额" align="right" min-width="160">
          <template #default="scope">
            <span style="font-size: 15px; font-weight: bold; color: #303133">
              {{ scope.row.totalOrderAmount }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="totalUsdt" label="USDT 归集总额" align="right" min-width="160">
          <template #default="scope">
            <span style="font-size: 15px; font-weight: 500">{{ scope.row.totalUsdt }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="totalOrderLoss" label="订单损耗 (Gas/手续费)" align="right" min-width="180">
          <template #default="scope">
            <span :style="{
              color: Number(scope.row.totalOrderLoss) > 0 ? '#F56C6C' : '#67C23A',
              fontWeight: 'bold',
              fontSize: '15px'
            }">
              {{ Number(scope.row.totalOrderLoss) > 0 ? '-' : '+' }}
              {{ Math.abs(scope.row.totalOrderLoss) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="estimatedProfit" label="预估净利润 (1%费率)" align="right" min-width="180">
          <template #default="scope">
             <span style="color: #409EFF; font-weight: bold; font-size: 15px">
               +{{ scope.row.estimatedProfit }}
             </span>
          </template>
        </el-table-column>

        <el-table-column prop="successCount" label="成功交易笔数" align="center" min-width="120">
          <template #default="scope">
            <el-tag type="info">{{ scope.row.successCount }} 笔</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 20px; color: #909399; font-size: 12px; line-height: 1.5">
        <p><i class="el-icon-info"></i> <strong>指标说明：</strong></p>
        <p>1. <strong>订单损耗：</strong> 计算公式 = ( 订单应收金额 - 实际归集到账金额 )。正数代表损耗（如Gas费磨损），负数代表盈余。</p>
        <p>2. <strong>预估利润：</strong> 按照系统设定的 1% 基础费率计算的理论营收。</p>
      </div>
    </el-card>
  </div>
</template>

<script setup name="ChainAnalysis">
import { ref, reactive, toRefs, onMounted } from 'vue';
import { getCollectionReport } from '@/api/cashier/collection'; // 复用之前的API

const loading = ref(true);
const dateRange = ref([]);

const data = reactive({
  queryParams: {
    // 这里我们不需要查详细列表，所以设为1即可，减少后端压力
    pageNum: 1,
    pageSize: 1,
    startTime: undefined,
    endTime: undefined
  },
  chainStatsList: []
});

const { queryParams, chainStatsList } = toRefs(data);

/** 获取数据 */
function getList() {
  loading.value = true;
  // 1. 处理时间范围
  if (dateRange.value && dateRange.value.length === 2) {
    queryParams.value.startTime = dateRange.value[0];
    queryParams.value.endTime = dateRange.value[1];
  } else {
    queryParams.value.startTime = undefined;
    queryParams.value.endTime = undefined;
  }

  // 2. 调用接口 (复用 CollectionReport 接口)
  getCollectionReport(queryParams.value).then(response => {
    const resData = response.data;

    if (resData && resData.chainStats) {
      chainStatsList.value = resData.chainStats;
    } else {
      chainStatsList.value = [];
    }
    loading.value = false;
  }).catch(() => {
    loading.value = false;
    chainStatsList.value = [];
  });
}

/** 搜索 */
function handleQuery() {
  getList();
}

/** 重置 */
function resetQuery() {
  dateRange.value = [];
  handleQuery();
}

/** 辅助：链颜色 */
function getChainTagType(chain) {
  if (chain === 'ETHEREUM') return '';
  if (chain === 'BSC') return 'warning';
  if (chain === 'TRON') return 'danger';
  if (chain === 'SOLANA') return 'success';
  return 'info';
}

/** 表格合计逻辑 (Element Plus 自定义合计) */
function getSummaries(param) {
  const { columns, data } = param;
  const sums = [];

  columns.forEach((column, index) => {
    // 第一列显示 "合计"
    if (index === 0) {
      sums[index] = '全链总计';
      return;
    }
    // 不计算合计的列
    if (index === 1) { // 链名称列不计算
      sums[index] = '';
      return;
    }

    // 计算数值列
    const values = data.map(item => Number(item[column.property]));
    if (!values.every(value => Number.isNaN(value))) {
      const sum = values.reduce((prev, curr) => {
        const value = Number(curr);
        if (!Number.isNaN(value)) {
          return prev + curr;
        } else {
          return prev;
        }
      }, 0);

      // 格式化显示精度
      if (column.property === 'totalUsdt' || column.property === 'totalOrderLoss' ||
        column.property === 'totalOrderAmount'|| column.property === 'estimatedProfit') {
        // 金额保留 6 位小数 (防止精度丢失)
        sums[index] = sum.toFixed(6);
      } else if (column.property === 'successCount') {
        // 笔数取整
        sums[index] = sum + ' 笔';
      } else {
        sums[index] = sum;
      }
    } else {
      sums[index] = '';
    }
  });

  return sums;
}

onMounted(() => {
  getList();
});
</script>

<style scoped>
.mb-2 {
  margin-bottom: 10px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>