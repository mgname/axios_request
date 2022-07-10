/*  
  axios封装
*/

import axios from "axios"
import qs from "qs"

// 根据环境变量区分接口的默认地址
switch (process.env.NODE_ENV) {
  case 'production':
    axios.defaults.baseURL = 'http://api.zhufengpeixun.cn'
    break;
  case 'test':
    axios.defaults.baseURL = 'http://192.168.20.12:8080'
    break;
  default:
    axios.defaults.baseURL = 'http://127.0.0.1:3000'
    break;
}
// 设置超时请求时间
axios.defaults.timeout = 10000

// 设置CORS跨域允许携带资源凭证
axios.defaults.withCredentials = true

/*  
  设置post请求头：告知服务器请求主体的数据格式（看服务器需要什么格式）
  x-www-form-urlencoded
*/
axios.defaults.headers['Content-Type'] = 'application/x-www-form-urlencoded'
// 这个方法只对post请求有效
axios.defaults.transformRequest = data => qs.stringify(data)

/*  
  设置请求拦截
    客户端发送请求 -> [请求拦截器] -> 服务器
    TOKEN校验（JWT）：接收服务器返回的token，存储到vuex/本地存储中，每一次向服务器发送请求，我们应该把token带上
*/
axios.interceptors.request.use(config => {
  // 携带上token
  let token = localStorage.getItem('token')
  token && (config.headers.Authorization = token)
  return config
}, error => {
  return Promise.reject(error)
})

/*  
  设置响应拦截
    服务器返回信息 -> [拦截的统一处理] -> 客户端js获取到信息
*/
// axios.defaults.validateStatus = status => {
//   // 自定义响应成功的HTTP状态码
//   return /^(2|3)\d{2}$/.test(status)
// }

axios.interceptors.response.use(response => {
  // 只返回响应主体中的信息（部分公司根据需求会进一步完善，例如根据服务器返回的CODE值来指定成功还是失败）
  return response.data
}, err => {
  let { response } = err 
  if (response) {
    // 服务器至少返回结果了
    // 响应已发送，只不过状态码不是200系列，设置不同状态码的不同处理
    switch (response.status) {
      case 401: // 当前请求需要用户验证（一般是未登录）
        break
      case 403: // 服务器已经理解请求，但是拒绝执行它（一般是TOKEN过期）
        localStorage.removeItem('token')
        // 跳转到登录页
        break
      case 404: // 请求失败，请求所希望得到的资源未在服务器上发现
        break
    }
    return Promise.reject(response)
  } else {
    // 服务器连结果都没有返回
    if (!window.navigator.onLine) {
      // 断网处理，可以跳转到断网页面
      return
    }
    return Promise.reject(err)
  }
})

export default axios