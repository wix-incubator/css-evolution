<script>
	import {onMount} from 'svelte';
	import {renderCSS, pretty} from './css';
	import {geneticCSS} from './genetic-css';
	export let samples = [];

	let selectedSample = -1;
	let pre = "";
	function updateSample(idx) {
		if (idx >= 0) {
			console.log(samples);
			const sample = samples[idx];
			style = sample.style;
			legacy = sample.legacy;
			semantic = sample.semantic;
			pre = sample.pre || "";
		}
	}

	let first = true;

	const peek = pixels => {
			if (first) { 
				canvas.style = `width:${pixels.width}px;height:${pixels.height}px;`
				first = false;
			}
			if (render) {
				const ctx = canvas.getContext('2d');
				ctx.putImageData(pixels, 0, 0);
			}
		}

	$: updateSample(selectedSample)
	let legacy = ``;
	let style = ``;
	let semantic = '<div></div>';
	let canvas = null;
	let render = true;
	let running = false;

	let container = null;

	let genetic;
	
	let output = '';
	let score = 0;
	let currentGeneration = 0;
	
	async function init (){
		first = true;
		currentGeneration = 0;
		genetic = null;
		running = false;
		genetic = await geneticCSS({semantic, legacy, style, peek, pre});
	}

	async function tick({best, scores, time, style}) {
		if (style && style !== output) {
			output = style;
			score = best.score;
		}
		setTimeout(async () => {
			if (running) {
				currentGeneration = currentGeneration + 1;
				tick(await genetic())
			}
		},0);
	}

	$: semantic && legacy && style && init()
	$: running && genetic && tick({})

</script>

<style>
	section {
		position: absolute;
		top: 25%;
		left: 25%;
	}
	footer {
		position: absolute;
		top: 75%;
		left: 25;
	}
	div {
		
	}
</style>

<div>
	<h1>CSS Evolution!</h1>
	<select bind:value={selectedSample}>
		<option value={-1}>Select</option>
		{#each samples as sample, i}
			<option value={i}>Sample {i + 1}</option>
		{/each}
	</select>
	<textarea bind:value={legacy}></textarea>
	<textarea bind:value={style}></textarea>
	<textarea bind:value={semantic}></textarea>
	<input type=checkbox bind:checked={running}>Running
	<br>
	<input type=checkbox bind:checked={render}>Render
	<span>Best score:{score} Generation:{currentGeneration}</span>
	<br>
	<sidebar>
		<canvas bind:this={canvas}/>
	</sidebar>
	<footer>
		{@html `<style>${output}</style>`}
		<div style="padding:20px">
			{@html semantic}
		</div>
		<pre>{output}</pre>
	</footer>
</div>
