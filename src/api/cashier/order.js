import request from '@/utils/request'

// 基础路径
// const apiBase = '/biz-api/order'
const apiBase = '/api-local/api/order'

/**
 * 分页查询订单列表
 * 对应后端: @GetMapping("/list")
 * 参数: query (OrderQueryDTO: pageNo, pageSize, orderId, status, chainId, createTimeStart, createTimeEnd)
 */
export function listOrder(query) {
    return request({
        url: `${apiBase}/list`,
        method: 'get',
        params: query, // GET 请求参数放在 params 中
        baseURL: ''
    })
}

/**
 * 根据订单号查询详情
 * 对应后端: @GetMapping("/detail/{orderId}")
 * 参数: orderId (String)
 */
export function getOrderDetail(orderId) {
    return request({
        url: `${apiBase}/detail/${orderId}`,
        method: 'get',
        baseURL: ''
    })
}