<script>
	import {onMount} from 'svelte';
	import _ from 'lodash';
	import {getPixels, matchImages, getImgUrl} from './pixels';
	import {extractCSSConsts, createGenerateRandomStyle, renderCSS, absoluteCoverPosition, pretty} from './css'
	import {initPool, evolvePool} from './genetic';
	import {genPickRandom, randomInt} from './random'
	export let html = '<div></div>';
	export let style = '';
	export let semantic = '<div></div>';
	$: source = `<style>${style}</style>${html}`
	let canvas;
	let container = null;
	let pool;
	let render = true;
	let fitnessFunc = null;
	let genStyle = null;
	let randomMutationType = genPickRandom({
		ADD: 15,
		REMOVE: 25,
		REPLACE: 5,
		TWEAK: 10,
		SHUFFLE: 1,
		// CROSS: 1
	})
	let display = null
	let ctx = null;
	const defaultPrePostPost = [{selector: 'root::before', ...absoluteCoverPosition},{selector: 'root::after', ...absoluteCoverPosition}]

	const pre = `span[class$="label"] {color:transparent !important;}
			`
	$: best = `<style>${pretty(pre + renderCSS(defaultPrePostPost.concat(display ? display.genes: [])), {parser:'css'})}</style>`

	let mutateFunc = null;
	
	async function init (){
		const styleNode = container.children[0];
		const origNode = container.children[1];
		const { offsetWidth, offsetHeight, className, outerHTML } = origNode;
		console.log({ offsetWidth, offsetHeight})
		canvas.style = `width: ${offsetWidth + 40}px; height: ${offsetHeight + 40}px;`;
		const cssConsts = await extractCSSConsts(styleNode);
		const pixels = await getPixels(offsetWidth, offsetHeight, html, pre + style);
		genStyle = createGenerateRandomStyle({...cssConsts, classNames:['root'/*,'link','label'*/]});//,
		ctx = canvas.getContext('2d');
		// for (let i = 0; i < pixels.data.length; i+= 4) {
		// 	pixels.data[i] = pixels.data[i+3] = 255;
		// 	pixels.data[i+1] = pixels.data[i+2] = 0
		// }
		ctx.putImageData(pixels, 0, 0);

		fitnessFunc = async genes => {
			const newPixels = await getPixels(offsetWidth, offsetHeight, semantic, pre+renderCSS(defaultPrePostPost.concat(genes)));
			if (render) {
				ctx.putImageData(newPixels, 0, 0);
			}
			return matchImages(newPixels, pixels) + genes.length /1000.0;
		};
		mutateFunc = (a, b) => {
			let type = randomMutationType();
			if (a.length < 2 ) {
				type = 'ADD';
			} else if (a.length > 12 && type === 'ADD') {
				type = 'REMOVE';
			}
			const idx = randomInt(a.length);

			switch (type) {
				case 'REPLACE':
					return a.slice(0,idx).concat([genStyle()], a.slice(idx + 1))
				case 'ADD':
					return a.slice(0,idx).concat([genStyle()], a.slice(idx))
				// case 'CROSS':
				// 	return a.concat(b).sort(() => Math.random() - 0.5).slice(0,a.length);
				case 'REMOVE':
					return a.slice(0,idx).concat(a.slice(idx + 1));
				case 'SHUFFLE':
					return _.shuffle(a.slice());
				case 'TWEAK':
					{
						const alt = genStyle(a[idx].type, a[idx].selector).value.split(' ');
						const val = a[idx].value.split(' ');
						for (let i = 0;i < Math.max(val.length / 4, 1);i++) {
							const part = randomInt(val.length);
							val[part] = alt[part];
						}
						return a.slice(0,idx).concat([{...a[idx], value: val.join(' ')}], a.slice(idx + 1))
					}
					

			}
		}
	
		pool = initPool(() => [ genStyle()]);
		// pool = initPool(() => [genStyle()]);
		display = pool.pool[0];

	}

	onMount(() => {
		init();
	})

	let evolving = false;

	let timer = null;
	let lastTimer = null;

	async function runEpoch() {
		// console.log('running');
		console.log({best:pool.pool[0].score,worst:pool.pool[pool.pool.length - 1].score, time: lastTimer ? performance.now() - lastTimer : 0})
		lastTimer = performance.now();
		pool = await evolvePool(pool, fitnessFunc, mutateFunc );
		window.pool = pool;
		display = pool.pool[0];
		// console.log(pool.pool.map(t => t.score));
		if (timer) {
			timer = setTimeout(runEpoch,0);
		}
	}

	function toggleEvolve() {
		if (timer) {
			clearTimeout(timer);

			timer = null;
		} else {
			timer = setTimeout(runEpoch,0)
		}
	}
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
	<button on:click={toggleEvolve}>Run</button>
	<br>
	<input type=checkbox bind:checked={render}>Render
	<span>Best score:{display && display.score} Generation:{display && pool.generation}</span>
	<br>
	<section bind:this={container}>
		{@html source}
	</section>
	<sidebar>
		<canvas bind:this={canvas}/>
	</sidebar>
	<footer>
		{@html best}
		<div style="padding:20px">
			{@html semantic}
		</div>
		<pre>{best}</pre>
	</footer>
</div>
