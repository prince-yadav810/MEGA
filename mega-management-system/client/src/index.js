import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/mobile-scroll.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import * as serviceWorkerRegistration from './utils/serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for push notifications
serviceWorkerRegistration.register({
  onSuccess: () => {
    console.log('Service Worker registered successfully! Push notifications enabled.');
  },
  onUpdate: (registration) => {
    console.log('Service Worker updated! New version available.');
  }
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
