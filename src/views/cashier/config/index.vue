<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true">
      <el-form-item label="配置描述" prop="description">
        <el-input
            v-model="queryParams.description"
            placeholder="请输入描述 (如: ETH热钱包)"
            clearable
            @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="配置类型" prop="configType">
        <el-select v-model="queryParams.configType" placeholder="选择类型" clearable style="width: 200px">
          <el-option label="热钱包 (Hot Wallet)" value="HOT_WALLET" />
          <el-option label="归集阈值 (Threshold)" value="THRESHOLD" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleBatchDelete">批量删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="RefreshRight" @click="handleReload">重载配置到内存</el-button>
      </el-col>
    </el-row>

    <el-table v-loading="loading" :data="configList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="ID" align="center" prop="id" width="60" />

      <el-table-column label="类型" align="center" prop="configType" width="120">
        <template #default="scope">
          <el-tag v-if="scope.row.configType === 'HOT_WALLET'" type="danger">热钱包</el-tag>
          <el-tag v-else-if="scope.row.configType === 'THRESHOLD'" type="success">归集阈值</el-tag>
          <el-tag v-else type="info">{{ scope.row.configType }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="区块链" align="center" prop="chainId" width="120">
        <template #default="scope">
          {{ formatChainId(scope.row.chainId) }}
        </template>
      </el-table-column>

      <el-table-column label="Key (键名)" align="center" prop="configKey" width="150" />

      <el-table-column label="Value (值)" align="center" prop="configValue" min-width="200">
        <template #default="scope">
          <div style="display: flex; align-items: center; justify-content: center;">
            <span v-if="!scope.row.showValue && isSensitive(scope.row.configKey)">
              ********
            </span>
            <span v-else>{{ scope.row.configValue }}</span>

            <el-button
                v-if="isSensitive(scope.row.configKey)"
                link
                type="primary"
                icon="View"
                style="margin-left: 10px"
                @click="scope.row.showValue = !scope.row.showValue"
            >
              {{ scope.row.showValue ? '隐藏' : '查看' }}
            </el-button>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="描述" align="center" prop="description" />
      <el-table-column label="更新时间" align="center" prop="updateTime" width="160" />

      <el-table-column label="操作" align="center" width="150" fixed="right">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
        v-show="total > 0"
        :total="total"
        v-model:current-page="queryParams.pageNo"
        v-model:page-size="queryParams.pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="getList"
        @current-change="getList"
    />

    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="configRef" :model="form" :rules="rules" label-width="100px">

        <el-form-item label="配置类型" prop="configType">
          <el-select v-model="form.configType" placeholder="请选择类型">
            <el-option label="热钱包 (Hot Wallet)" value="HOT_WALLET" />
            <el-option label="归集阈值 (Threshold)" value="THRESHOLD" />
            <el-option label="其他 (Other)" value="OTHER" />
          </el-select>
        </el-form-item>

        <el-form-item label="区块链" prop="chainId">
          <el-select v-model="form.chainId" placeholder="请选择链">
            <el-option label="Ethereum (1)" value="1" />
            <el-option label="BSC (56)" value="56" />
            <el-option label="TRON (Mainnet)" value="728126428" />
            <el-option label="Solana (-1)" value="-1" />
          </el-select>
        </el-form-item>

        <el-form-item label="Key (键名)" prop="configKey">
          <el-input v-model="form.configKey" placeholder="例如: address 或 privateKey" />
        </el-form-item>

        <el-form-item label="Value (值)" prop="configValue">
          <el-input v-model="form.configValue" type="textarea" :rows="3" placeholder="请输入具体的值，如钱包地址或私钥" />
        </el-form-item>

        <el-form-item label="描述备注" prop="description">
          <el-input v-model="form.description" placeholder="请输入中文描述，例如：以太坊热钱包地址" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {ref, reactive, onMounted} from 'vue';
import {ElMessage, ElMessageBox} from 'element-plus';
import {
  listConfig,
  getConfig,
  addConfig,
  updateConfig,
  delConfig,
  batchDelConfig,
  reloadConfig
} from '@/api/cashier/config';

// 定义表单的 ref 引用 (关键修复: 必须定义这个变量)
const configRef = ref(null);
const queryRef = ref(null);

// 响应式数据
const configList = ref([]);
const open = ref(false);
const loading = ref(true);
const total = ref(0);
const title = ref("");
const ids = ref([]);
const multiple = ref(true);

const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  description: undefined,
  configType: undefined
});

const form = ref({});
const rules = {
  configType: [{required: true, message: "类型不能为空", trigger: "change"}],
  chainId: [{required: true, message: "链ID不能为空", trigger: "change"}],
  configKey: [{required: true, message: "键名不能为空", trigger: "blur"}],
  configValue: [{required: true, message: "值不能为空", trigger: "blur"}],
  description: [{required: true, message: "描述不能为空", trigger: "blur"}]
};

/** 辅助函数：格式化链名称 */
function formatChainId(chainId) {
  const map = {
    '1': 'Ethereum',
    '56': 'BSC (Smart Chain)',
    '728126428': 'TRON',
    '-1': 'Solana'
  };
  return map[chainId] || `ChainID: ${chainId}`;
}

/** 辅助函数：判断是否敏感字段 */
function isSensitive(key) {
  if (!key) return false;
  const k = key.toLowerCase();
  return k.includes('private') || k.includes('key') || k.includes('secret') || k.includes('password');
}

/** 查询列表 */
function getList() {
  loading.value = true;
  listConfig(queryParams).then(res => {
    // 适配后端数据结构：records
    configList.value = res.data.records.map(item => ({
      ...item,
      showValue: false // 前端添加辅助字段，默认隐藏敏感数据
    }));
    total.value = res.data.total;
    loading.value = false;
  });
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.pageNo = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  if (queryRef.value) {
    queryRef.value.resetFields(); // 使用 Element Plus 自带的重置
  }
  queryParams.description = undefined;
  queryParams.configType = undefined;
  handleQuery();
}

/** 多选框选中数据 */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id);
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加配置";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const id = row.id || ids.value[0];
  getConfig(id).then(res => {
    form.value = res.data;
    open.value = true;
    title.value = "修改配置";
  });
}

/** 提交按钮 (关键修复) */
function submitForm() {
  // 修复: 在 <script setup> 中不能使用 this.$refs，必须使用 configRef.value
  if (!configRef.value) return;

  configRef.value.validate(valid => {
    if (valid) {
      if (form.value.id != null) {
        updateConfig(form.value.id, form.value).then(() => {
          ElMessage.success("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addConfig(form.value).then(() => {
          ElMessage.success("新增成功");
          open.value = false;
          getList();
        });
      }
    }
  });
}

/** 删除按钮操作 */
function handleDelete(row) {
  ElMessageBox.confirm(`确认删除配置 "${row.description}" 吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    return delConfig(row.id);
  }).then(() => {
    getList();
    ElMessage.success("删除成功");
  });
}

/** 批量删除按钮操作 */
function handleBatchDelete() {
  ElMessageBox.confirm(`确认删除选中的 ${ids.value.length} 条数据吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    return batchDelConfig(ids.value);
  }).then(() => {
    getList();
    ElMessage.success("批量删除成功");
  });
}

/** 重新加载配置 */
function handleReload() {
  reloadConfig().then(() => {
    ElMessage.success("后台内存配置已刷新，新规则已生效");
  });
}

/** 表单重置 */
function reset() {
  form.value = {
    id: null,
    configType: 'HOT_WALLET', // 默认值
    chainId: '56', // 默认BSC
    configKey: null,
    configValue: null,
    description: null,
    status: 1
  };
  // 重置校验状态
  if (configRef.value) {
    configRef.value.resetFields();
  }
}

function cancel() {
  open.value = false;
  reset();
}

onMounted(() => {
  getList();
});
</script>

<style scoped>
.mb8 {
  margin-bottom: 8px;
}

.app-container {
  padding: 20px;
}

/* 使表格中的敏感数据按钮更好看 */
.el-button--link {
  padding: 0;
  height: auto;
}
</style>