<template>
  <div class="app-container home">
    <el-row :gutter="20">
      <el-col :sm="24" :lg="12" style="padding-left: 20px">
        <h2>USDT Enterprise Payment Gateway</h2>
        <p>
          企业级数字货币聚合收银台。提供安全、稳定、高效的区块链支付解决方案，支持多链 USDT 充值、自动归集、资金下发及账务对账功能。
        </p>
        <p>
          <b>当前版本:</b> <span>v{{ version }} (Pro)</span>
        </p>
        <p>
          <el-tag type="success" effect="dark">系统运行正常</el-tag>
          <el-tag type="warning" style="margin-left: 10px">TRON 节点延时: 24ms</el-tag>
        </p>
        <p>
          <el-button
              type="primary"
              icon="Monitor"
              plain
              @click="goTarget('/monitor/server')"
          >节点监控</el-button>
          <el-button
              icon="Document"
              plain
              @click="goTarget('https://developers.tron.network/')"
          >开发文档</el-button>
        </p>
      </el-col>

      <el-col :sm="24" :lg="12" style="padding-left: 50px">
        <el-row>
          <el-col :span="12">
            <h2>技术栈与架构</h2>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="10">
            <h4>支持公链</h4>
            <ul>
              <li><span style="color: #e03e2d">●</span> TRON (TRC20) - <b>主力</b></li>
              <li><span style="color: #409eff">●</span> Ethereum (ERC20)</li>
              <li><span style="color: #e6a23c">●</span> BSC (BEP20)</li>
              <li><span style="color: #67c23a">●</span> Solana (SPL)</li>
            </ul>
          </el-col>
          <el-col :span="14">
            <h4>核心特性</h4>
            <ul>
              <li>冷热钱包物理隔离</li>
              <li>Redis 分布式锁防并发</li>
              <li>TRON 能量租赁 (Gas节省)</li>
              <li>私钥 KMS 云端加密托管</li>
            </ul>
          </el-col>
        </el-row>
      </el-col>
    </el-row>

    <el-divider />

    <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :md="12" :lg="8">
        <el-card class="update-log">
          <template v-slot:header>
            <div class="clearfix">
              <span>商务与技术支持</span>
            </div>
          </template>
          <div class="body">
            <p>
              <i class="el-icon-s-custom"></i> 商务合作：
              <el-link href="#" target="_blank" type="primary">Charles.zhaoqc@outlook.com</el-link>
            </p>
            <p>
              <i class="el-icon-chat-dot-round"></i> 技术值班：
              <el-link href="#" target="_blank" type="success">Telegram:@CharlesZqc</el-link>
            </p>
            <p>
              <i class="el-icon-message"></i> 报警邮箱：
              <span>Zqclovez@gmail.com</span>
            </p>
            <div style="margin-top: 10px; font-size: 12px; color: #909399;">
              *遇到资金归集异常或节点同步延迟，请优先联系技术值班。
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="12" :lg="8">
        <el-card class="update-log">
          <template v-slot:header>
            <div class="clearfix">
              <span>系统更新日志</span>
            </div>
          </template>
          <el-collapse accordion v-model="activeName">
            <el-collapse-item title="v1.2.0 - 2026-01-20" name="1">
              <ol>
                <li>新增 Redis 分布式锁，解决高并发归集冲突</li>
                <li>集成 TRON 能量租赁模块，Gas 费降低 80%</li>
                <li>新增 Solana 链 USDT 充值支持</li>
                <li>优化 RPC 节点轮询机制，提升查账稳定性</li>
              </ol>
            </el-collapse-item>
            <el-collapse-item title="v1.1.5 - 2026-01-10" name="2">
              <ol>
                <li>修复 BSC 链区块回滚导致的假充值问题</li>
                <li>增加大额资金入账 Telegram 报警通知</li>
                <li>优化前端钱包余额查询接口响应速度</li>
              </ol>
            </el-collapse-item>
            <el-collapse-item title="v1.0.0 - 2025-12-01" name="3">
              <ol>
                <li>系统初始化，支持 TRC20/ERC20 基础充值</li>
                <li>完成冷热钱包分离架构设计</li>
              </ol>
            </el-collapse-item>
          </el-collapse>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="12" :lg="8">
        <el-card class="update-log">
          <template v-slot:header>
            <div class="clearfix">
              <span>今日资金概览 (实时)</span>
            </div>
          </template>
          <div class="body">
            <div class="stat-item">
              <div class="stat-title">今日充值总额 (USDT)</div>
              <div class="stat-value" style="color: #f56c6c">124,592.00</div>
            </div>
            <div class="stat-item">
              <div class="stat-title">今日归集笔数</div>
              <div class="stat-value" style="color: #409eff">3,421 笔</div>
            </div>
            <div class="stat-item">
              <div class="stat-title">热钱包 TRX 余额 (Gas)</div>
              <div class="stat-value" style="color: #e6a23c">5,200 TRX</div>
            </div>
            <div style="text-align: right; margin-top: 10px;">
              <el-tag size="small">自动刷新: 开</el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup name="Index">
import { ref } from 'vue';

const version = ref('1.2.0')
const activeName = ref('1')

function goTarget(url) {
  if(url.startsWith('http')) {
    window.open(url, '__blank')
  } else {
    // 如果是内部路由，这里可以结合 router.push，暂且为了演示保持原样
    console.log('跳转路由:', url)
  }
}
</script>

<style scoped lang="scss">
.home {
  blockquote {
    padding: 10px 20px;
    margin: 0 0 20px;
    font-size: 17.5px;
    border-left: 5px solid #eee;
  }
  hr {
    margin-top: 20px;
    margin-bottom: 20px;
    border: 0;
    border-top: 1px solid #eee;
  }
  .col-item {
    margin-bottom: 20px;
  }

  ul {
    padding: 0;
    margin: 0;
  }

  font-family: "open sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 13px;
  color: #676a6c;
  overflow-x: hidden;

  ul {
    list-style-type: none;
  }

  h4 {
    margin-top: 0px;
  }

  h2 {
    margin-top: 10px;
    font-size: 26px;
    font-weight: 100;
  }

  p {
    margin-top: 10px;

    b {
      font-weight: 700;
    }
  }

  .update-log {
    ol {
      display: block;
      list-style-type: decimal;
      margin-block-start: 1em;
      margin-block-end: 1em;
      margin-inline-start: 0;
      margin-inline-end: 0;
      padding-inline-start: 40px;
    }
    .body {
      .stat-item {
        margin-bottom: 15px;
        border-bottom: 1px dashed #eee;
        padding-bottom: 10px;
        &:last-child {
          border-bottom: none;
        }
        .stat-title {
          font-size: 14px;
          color: #909399;
          margin-bottom: 5px;
        }
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          font-family: 'Arial', sans-serif;
        }
      }
    }
  }
}
</style>