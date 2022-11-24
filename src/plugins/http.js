import axios from 'axios'

axios.defaults.withCredentials = true

export const http = axios.create({
    baseURL: process.env.NODE_ENV == 'development' ? 'http://localhost:8001/' : 'http://10.166.152.87/share/',
    // baseURL: 'http://10.166.152.87:8000/',
    timeout: 2000
})

export default http