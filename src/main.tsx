import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

if (import.meta.env.DEV) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  import('@axe-core/react').then((axe) => {
    axe.default(React, ReactDOM, 1000);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
