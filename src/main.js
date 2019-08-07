import App from './App.svelte';
import {html, style, semantic} from './sample';

const app = new App({
	target: document.body,
	props: {html, style, semantic}
});

export default app;