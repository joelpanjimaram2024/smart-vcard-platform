import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const rootElement = document.getElementById('root');
console.log('Main.tsx: Root element found:', !!rootElement);
if (!rootElement) {
  console.error('Failed to find root element');
  document.body.innerHTML = '<h1 style="color: red;">Failed to find root element</h1>';
} else {
  try {
    console.log('Main.tsx: Creating root...');
    const root = createRoot(rootElement);
    console.log('Main.tsx: Rendering app...');
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    console.log('Main.tsx: App rendered successfully');
  } catch (err) {
    console.error('Failed to render app:', err);
    document.body.innerHTML = `<h1 style="color: red;">Failed to render app: ${err}</h1>`;
  }
}
