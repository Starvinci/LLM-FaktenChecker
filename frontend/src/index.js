// index.js
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './styles.css'; // optional, falls du globale Styles hast

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
