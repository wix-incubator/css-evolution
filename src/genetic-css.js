import {genPickRandom, randomInt} from './random'
import {initPool, evolvePool} from './genetic';
import {getPixels, matchImages, getImgUrl} from './pixels';
import {extractCSSConsts, createGenerateRandomStyle, renderCSS, absoluteCoverPosition, contentEmpty} from './css'
import _ from 'lodash';

const defaultPrePostPost = ['root::before','root::after'].map(selector => ([{selector, ...absoluteCoverPosition},{selector, ...contentEmpty}])).flat()
console.log('defaultPrePostPost', defaultPrePostPost)
const pre = `span[class$="label"] {color:transparent !important;}
`

const randomMutationType = genPickRandom({
    ADD: 15,
    REMOVE: 25,
    REPLACE: 5,
    TWEAK: 10,
    SHUFFLE: 3,
    // CROSS: 1
});

export default class GeneticCSS {
    constructor(peek) {
        this.peek = peek || (() => {});
    }
    async init(semantic, outerHTML, style) {
        const styleNode = document.createElement('style');
        document.body.appendChild(styleNode);
        styleNode.innerHTML = style;
        const wrapper = document.createElement('div');
        wrapper.innerHTML = outerHTML;
        const node = wrapper.firstChild;
        document.body.appendChild(node);
        const {offsetWidth, offsetHeight} = node;
        document.body.removeChild(node);
        const cssConsts = await extractCSSConsts(styleNode);
        document.body.removeChild(styleNode);

		this.pixels = await getPixels(offsetWidth, offsetHeight, outerHTML, pre + styleNode.innerText);
		this.genStyle = createGenerateRandomStyle({...cssConsts, classNames:['root'/*,'link','label'*/]});//,
		this.peek(this.pixels);

		this.fitnessFunc = async genes => {
			const newPixels = await getPixels(offsetWidth, offsetHeight, semantic, pre+renderCSS(defaultPrePostPost.concat(genes)));
			this.peek(newPixels);
			return matchImages(newPixels, this.pixels) + genes.length /1000.0;
		};
		this.mutateFunc = (a, b) => {
			let type = randomMutationType();
			if (a.length < 2 ) {
				type = 'ADD';
			} else if (a.length > 12 && type === 'ADD') {
				type = 'REMOVE';
			}
			const idx = randomInt(a.length);

			switch (type) {
				case 'REPLACE':
					return a.slice(0,idx).concat([this.genStyle()], a.slice(idx + 1))
				case 'ADD':
					return a.slice(0,idx).concat([this.genStyle()], a.slice(idx))
				// case 'CROSS':
				// 	return a.concat(b).sort(() => Math.random() - 0.5).slice(0,a.length);
				case 'REMOVE':
					return a.slice(0,idx).concat(a.slice(idx + 1));
				case 'SHUFFLE':
					return _.shuffle(a.slice());
				case 'TWEAK':
					{
						const alt = this.genStyle(a[idx].type, a[idx].selector).value.split(' ');
						const val = a[idx].value.split(' ');
						for (let i = 0;i < Math.max(val.length / 4, 1);i++) {
							const part = randomInt(val.length);
							val[part] = alt[part];
						}
						return a.slice(0,idx).concat([{...a[idx], value: val.join(' ')}], a.slice(idx + 1))
					}
					

			}
        }
        this.population = initPool(() => [ this.genStyle()]);
        return this;
    }
    async runEpoch(callback) {
		const startTime = performance.now();
        this.population = await evolvePool(this.population, this.fitnessFunc, this.mutateFunc );
        const best = _.first(this.population.pool);
        const worst = _.last(this.population.pool)
        const style = pre+renderCSS(defaultPrePostPost.concat(best.genes));
        const res = {
            best,
            style, 
            scores: [best.score, worst.score], 
            time: performance.now() - startTime
        };
		callback(res)
    }
}
