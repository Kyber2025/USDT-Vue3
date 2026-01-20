import request from '@/utils/request'

// 基础路径：Nginx前缀(/api-local) + 后端Context(/api) + Controller路径(/balance)
const apiBase = '/api-local/api/balance'
// const apiBase = '/biz-api/balance'

/**
 * 查询所有链的余额
 */
export function listWalletBalance() {
    return request({
        url: `${apiBase}/list`,
        method: 'get',
        baseURL: '' // 强制覆盖默认 baseURL，使用自定义的 apiBase
    })
}

/**
 * 查询指定链的余额
 * @param {String} chainId 链ID
 */
export function getWalletBalance(chainId) {
    return request({
        url: `${apiBase}/detail/${chainId}`,
        method: 'get',
        baseURL: ''
    })
}

/**
 * 重新加载钱包余额
 */
export function reloadWalletBalance() {
    return request({
        url: `${apiBase}/reload`,
        method: 'post',
        baseURL: ''
    })
}

/**
 * 通过链ID和地址查询余额
 * @param {String} chainId 链ID (如 'ETH', 'TRON')
 * @param {String} address 钱包地址
 */
export function getWalletBalanceByAddress(chainId, address) {
    return request({
        url: `${apiBase}/${chainId}/${address}`,
        method: 'get',
        baseURL: ''
    })
}