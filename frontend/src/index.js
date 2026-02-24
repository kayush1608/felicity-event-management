import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import './index.css';
import App from './App';

// Configure axios base URL for production
// REACT_APP_API_URL is expected to be something like https://your-backend.onrender.com/api
// Since all code uses paths like '/api/auth/login', we set baseURL to the origin (without /api)
const apiUrl = process.env.REACT_APP_API_URL;
if (apiUrl) {
  // Remove trailing /api or /api/ to get the base origin
  axios.defaults.baseURL = apiUrl.replace(/\/api\/?$/, '');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
