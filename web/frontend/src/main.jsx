import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

// Cấu hình Bearer Token xác thực mặc định cho mọi lượt gọi API
const API_TOKEN = 'iot_esp32_token_ptit_2026';
axios.defaults.headers.common['Authorization'] = `Bearer ${API_TOKEN}`;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
