import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx' // This now points to your renamed file
import 'bootstrap/dist/css/bootstrap.min.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)