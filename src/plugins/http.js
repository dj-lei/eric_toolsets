import axios from 'axios'

axios.defaults.withCredentials = true

export const http = axios.create({
    baseURL: 'http://localhost:8001/',
    timeout: 60000
})

export default http