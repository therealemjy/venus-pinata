import App from 'App';
import { createRoot } from 'react-dom/client';

import 'assets/styles/index.css';

import initializeLibraries from './initializeLibraries';

initializeLibraries();

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
