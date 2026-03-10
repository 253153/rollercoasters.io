import { App } from './app/App';

const container = document.getElementById('app');
if (!container) throw new Error('Missing #app container');

new App(container);
