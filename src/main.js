import App from './App.svelte';
import {samples} from './sample';

const app = new App({
	target: document.body,
	props: {samples}
});

export default app;