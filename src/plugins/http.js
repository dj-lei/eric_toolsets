// import axios from 'axios'

// axios.defaults.withCredentials = true

// export const service = axios.create({
//     baseURL: 'http://localhost:8000/',
//     timeout: 60000
// })

// export default service

import { io } from "socket.io-client"

export const service = io("http://127.0.0.1:8000")

export default service