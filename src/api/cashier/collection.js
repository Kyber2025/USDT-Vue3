import request from '@/utils/request'

// 基础路径：Nginx前缀(/api-local) + 后端Context(/api) + Controller路径(/collection)
// 对应后端 @RequestMapping("/collection")
const apiBase = '/api-local/api/collection'
// const apiBase = '/biz-api/collection'

/**
 * 获取归集报表（含统计指标和交易明细）
 * 对应后端: @PostMapping("/report")
 * * @param {Object} query 查询参数 (对应 CollectionQueryDTO)
 * @param {Number} query.pageNum 页码 (默认1)
 * @param {Number} query.pageSize 每页条数 (默认10)
 * @param {String} [query.chainType] 链类型: 'BSC', 'ETHEREUM', 'SOLANA'
 * @param {String} [query.transactionType] 交易类型: 'GAS_TRANSFER', 'USDT_TRANSFER'
 * @param {String} [query.transactionStatus] 状态: 'SUCCESS'
 * @param {String} [query.keyword] 关键词: 交易哈希/地址
 * @param {String} [query.startTime] 开始时间 (yyyy-MM-dd HH:mm:ss)
 * @param {String} [query.endTime] 结束时间 (yyyy-MM-dd HH:mm:ss)
 */
export function getCollectionReport(query) {
    return request({
        url: `${apiBase}/report`,
        method: 'post',
        baseURL: '', // 强制覆盖默认 baseURL，使用自定义的 apiBase
        data: query  // Post请求使用 data 传递 @RequestBody
    })
}

/**
 * 获取今日概况 (Dashboard)
 */
export function getTodaySummary() {
    return request({
        url: `${apiBase}/dashboard/today`,
        method: 'get',
        baseURL: '',
    })
}