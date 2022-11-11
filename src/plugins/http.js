import axios from 'axios'

axios.defaults.withCredentials = true

export const service = axios.create({
    baseURL: 'http://localhost:8000/',
    timeout: 60000
})

export default service
