import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import * as App from './app.tsx';

let root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App.Root />
    </React.StrictMode>
);