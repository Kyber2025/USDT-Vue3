<template>
  <div class="app-container">
    <el-card class="search-card" shadow="never">
      <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="80px">
        <el-form-item label="订单号" prop="orderId">
          <el-input
              v-model="queryParams.orderId"
              placeholder="请输入订单号"
              clearable
              @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item label="链ID" prop="chainId">
          <el-input
              v-model="queryParams.chainId"
              placeholder="例如: 1, 56, 728126428"
              clearable
              @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 150px">
            <el-option label="待支付" value="PENDING" />
            <el-option label="确认中" value="CONFIRMING" />
            <el-option label="支付成功" value="PAID" />
            <el-option label="已过期" value="EXPIRED" />
            <el-option label="失败" value="FAILED" />
          </el-select>
        </el-form-item>

        <el-form-item label="创建时间">
          <el-date-picker
              v-model="dateRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD HH:mm:ss"
              :default-time="defaultTime"
              @change="handleDateChange"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <el-table
          v-loading="loading"
          :data="orderList"
          style="width: 100%"
      >
        <el-table-column label="ID" prop="id" width="60" align="center" />
        <el-table-column label="订单号" prop="orderId" min-width="150" show-overflow-tooltip />
        <el-table-column label="链ID" prop="chainId" width="120" align="center" />
        <el-table-column label="金额" prop="amount" width="120" align="right">
          <template #default="scope">
            {{ scope.row.amount }}
          </template>
        </el-table-column>
        <el-table-column label="收款地址" prop="address" min-width="150" show-overflow-tooltip />

        <el-table-column label="状态" prop="status" width="100" align="center">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" prop="createTime" width="180" align="center" />

        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="scope">
            <el-button link type="primary" icon="View" @click="handleDetail(scope.row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
            v-if="total > 0"
            v-model:current-page="queryParams.pageNo"
            v-model:page-size="queryParams.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleQuery"
            @current-change="handleQuery"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" title="订单详情" width="600px" append-to-body>
      <el-descriptions :column="1" border v-loading="detailLoading">
        <el-descriptions-item label="ID">{{ currentOrder.id }}</el-descriptions-item>
        <el-descriptions-item label="订单号">{{ currentOrder.orderId }}</el-descriptions-item>
        <el-descriptions-item label="当前状态">
          <el-tag :type="getStatusType(currentOrder.status)">
            {{ getStatusLabel(currentOrder.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="链ID">{{ currentOrder.chainId }}</el-descriptions-item>
        <el-descriptions-item label="金额">{{ currentOrder.amount }}</el-descriptions-item>
        <el-descriptions-item label="收款地址">{{ currentOrder.address }}</el-descriptions-item>
        <el-descriptions-item label="地址索引">{{ currentOrder.addressIndex || '-' }}</el-descriptions-item>
        <el-descriptions-item label="交易哈希">
          <span v-if="currentOrder.txHash" class="break-all">{{ currentOrder.txHash }}</span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="发送方">{{ currentOrder.fromAddress || '-' }}</el-descriptions-item>
        <el-descriptions-item label="区块高度">{{ currentOrder.blockNumber || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentOrder.createTime }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ currentOrder.updateTime }}</el-descriptions-item>
        <el-descriptions-item label="过期时间">{{ currentOrder.expiresAt }}</el-descriptions-item>
        <el-descriptions-item label="归集时间">{{ currentOrder.collectTime || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">关 闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {ref, reactive, onMounted} from 'vue'
import {listOrder, getOrderDetail} from '@/api/cashier/order.js' // 确保你的API文件路径正确
import {ElMessage} from 'element-plus'
import {Search, Refresh, View} from '@element-plus/icons-vue'

// --- 状态定义 ---
const loading = ref(false)
const detailLoading = ref(false)
const total = ref(0)
const orderList = ref([])
const dateRange = ref([])
const dialogVisible = ref(false)
const currentOrder = ref({})

// 查询参数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  orderId: undefined,
  chainId: undefined,
  status: undefined,
  createTimeStart: undefined,
  createTimeEnd: undefined
})

// 时间选择器默认时间
const defaultTime = [
  new Date(2000, 1, 1, 0, 0, 0),
  new Date(2000, 1, 1, 23, 59, 59),
]

// --- 适配你的JSON返回结构 ---
const getList = async () => {
  loading.value = true
  try {
    const res = await listOrder(queryParams)

    // 安全获取 data 节点
    const responseData = res.data || res // 兼容拦截器是否解包

    if (responseData && responseData.records) {
      // 数据在 records 中
      orderList.value = responseData.records
      total.value = responseData.total
    } else if (res.records) {
      // 如果拦截器直接把 data 这一层解开了
      orderList.value = res.records
      total.value = res.total
    } else {
      // 兜底
      orderList.value = []
      total.value = 0
    }

  } catch (error) {
    console.error('获取订单列表失败', error)
    orderList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 处理搜索
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

// 处理重置
const resetQuery = () => {
  queryParams.orderId = undefined
  queryParams.chainId = undefined
  queryParams.status = undefined
  queryParams.createTimeStart = undefined
  queryParams.createTimeEnd = undefined
  dateRange.value = []
  handleQuery()
}

// 处理日期变化
const handleDateChange = (val) => {
  if (val && val.length === 2) {
    queryParams.createTimeStart = val[0]
    queryParams.createTimeEnd = val[1]
  } else {
    queryParams.createTimeStart = undefined
    queryParams.createTimeEnd = undefined
  }
}

// 查看详情 (这里也做适配)
const handleDetail = async (row) => {
  dialogVisible.value = true
  detailLoading.value = true
  currentOrder.value = {} // 清空

  try {
    const res = await getOrderDetail(row.orderId)
    // 假设详情接口返回结构: { code: 200, data: { ...订单对象 } }
    const detailData = res.data || res
    currentOrder.value = detailData
  } catch (error) {
    console.error('获取详情失败', error)
    ElMessage.error('获取详情失败')
  } finally {
    detailLoading.value = false
  }
}

// --- 辅助函数 ---

// 状态字典映射
const getStatusLabel = (status) => {
  const map = {
    'PENDING': '待支付',
    'CONFIRMING': '确认中',
    'PAID': '支付成功',
    'EXPIRED': '已过期',
    'FAILED': '失败'
  }
  return map[status] || status
}

// 状态颜色映射
const getStatusType = (status) => {
  const map = {
    'PENDING': 'warning',
    'CONFIRMING': 'primary',
    'PAID': 'success',
    'EXPIRED': 'info',
    'FAILED': 'danger'
  }
  return map[status] || ''
}

// --- 初始化 ---
onMounted(() => {
  getList()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.break-all {
  word-break: break-all; /* 可以在长哈希处自动换行 */
}
</style>