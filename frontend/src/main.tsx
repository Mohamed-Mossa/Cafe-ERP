import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './app/store';
import AppRouter from './app/router';
import { I18nProvider } from './i18n';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <I18nProvider>
        <AppRouter />
      </I18nProvider>
    </Provider>
  </React.StrictMode>
);
