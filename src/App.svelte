<script>
	import {onMount} from 'svelte';
	import {renderCSS, pretty} from './css';
	import GeneticCSS from './genetic-css';
	export let samples = [];

	let selectedSample = -1;

	function updateSample(idx) {
		if (idx >= 0) {
			const sample = samples[idx];
			style = sample.style;
			html = sample.html;
			semantic = sample.semantic;
		}
	}
	$: updateSample(selectedSample)
	let html = ``;
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
		let first = true;
		currentGeneration = 0;
		const gcss = new GeneticCSS(pixels => {
			if (first) { 
				canvas.style = `width:${pixels.width}px;height:${pixels.height}px;`
				first = false;
			}
			if (render) {
				const ctx = canvas.getContext('2d');
				ctx.putImageData(pixels, 0, 0);
			}
		})
		await gcss.init(semantic, html, style);
		running = false;
		genetic = gcss;
	}

	async function tick({best, scores, time, style}) {
		if (style && style !== output) {
			output = style;
			score = best.score;
		}
		setTimeout(() => {
			if (running) {
				currentGeneration = currentGeneration + 1;
				genetic.runEpoch(tick)
			}
		},0);
	}

	$: semantic && html && style && init()
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
	<textarea bind:value={html}></textarea>
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
