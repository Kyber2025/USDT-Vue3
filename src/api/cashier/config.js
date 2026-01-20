import request from '@/utils/request'

// 基础路径，根据你的 Nginx 或开发环境配置调整
// const apiBase = '/biz-api/config'
const apiBase = '/api-local/api/config'

export function listConfig(query) {
    return request({
        url: `${apiBase}/page`,
        method: 'get',
        params: query,
        baseURL: ''
    })
}

export function getConfig(id) {
    return request({
        url: `${apiBase}/detail/${id}`,
        method: 'get',
        baseURL: ''
    })
}

export function addConfig(data) {
    return request({
        url: `${apiBase}/add`,
        method: 'post',
        data: data,
        baseURL: ''
    })
}

export function updateConfig(id, data) {
    return request({
        url: `${apiBase}/update/${id}`,
        method: 'put',
        data: data,
        baseURL: ''
    })
}

export function delConfig(id) {
    return request({
        url: `${apiBase}/delete/${id}`,
        method: 'delete',
        baseURL: ''
    })
}

export function batchDelConfig(ids) {
    return request({
        url: `${apiBase}/batchDelete`,
        method: 'delete',
        data: ids,
        baseURL: ''
    })
}

export function reloadConfig() {
    return request({
        url: `${apiBase}/reload`,
        method: 'post',
        baseURL: ''
    })
}