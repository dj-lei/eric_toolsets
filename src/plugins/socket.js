import { io } from "socket.io-client"

export const service = io("http://127.0.0.1:8000")

export default service