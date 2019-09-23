import { genPickRandom, randomInt } from './random';
import { initPool, evolvePool } from './genetic';
import { getPixels, matchImages, getImgUrl } from './pixels';
import { extractCSSConsts, createGenerateRandomStyle, renderCSS, absoluteCoverPosition, contentEmpty } from './css';
import _ from 'lodash';

const defaultPrePostPost = ['root::before', 'root::after']
  .map(selector => [{ selector, ...absoluteCoverPosition }, { selector, ...contentEmpty }])
  .flat();


const randomMutationType = genPickRandom({
  ADD: 15,
  REMOVE: 25,
  REPLACE: 5,
  TWEAK: 10,
  SHUFFLE: 3
});

export async function geneticCSS({ peek, semantic, legacy, style, pre, initial }) {
  peek = peek || (() => {});
  pre = pre || '';
  const styleNode = document.createElement('style');
  document.body.appendChild(styleNode);
  styleNode.innerHTML = style;
  const wrapper = document.createElement('div');
  wrapper.innerHTML = legacy;
  const node = wrapper.firstChild;
  document.body.appendChild(node);
  const { offsetWidth, offsetHeight } = node;
  document.body.removeChild(node);
  const cssConsts = await extractCSSConsts(styleNode);
  document.body.removeChild(styleNode);

  const pixels = await getPixels(offsetWidth, offsetHeight, legacy, pre + styleNode.innerText);
  const genStyle = createGenerateRandomStyle({ ...cssConsts, classNames: ['root' /*,'link','label'*/] }); //,
  peek(pixels);

  const fitnessFunc = async genes => {
    const newPixels = await getPixels(
      offsetWidth,
      offsetHeight,
      semantic,
      pre + renderCSS(defaultPrePostPost.concat(genes))
    );
    peek(newPixels);
    return matchImages(newPixels, pixels) + genes.length / 1000.0;
  };
  const mutateFunc = (a, b) => {
    let type = randomMutationType();
    if (a.length < 2) {
      type = 'ADD';
    } else if (a.length > 12 && type === 'ADD') {
      type = 'REMOVE';
    }
    const idx = randomInt(a.length);

    switch (type) {
      case 'REPLACE':
        return a.slice(0, idx).concat([genStyle()], a.slice(idx + 1));
      case 'ADD':
        return a.slice(0, idx).concat([genStyle()], a.slice(idx));
      // case 'CROSS':
      // 	return a.concat(b).sort(() => Math.random() - 0.5).slice(0,a.length);
      case 'REMOVE':
        return a.slice(0, idx).concat(a.slice(idx + 1));
      case 'SHUFFLE':
        return _.shuffle(a.slice());
      case 'TWEAK': {
        const alt = genStyle(a[idx].type, a[idx].selector).value.split(' ');
        const val = a[idx].value.split(' ');
        for (let i = 0; i < Math.max(val.length / 4, 1); i++) {
          const part = randomInt(val.length);
          val[part] = alt[part];
        }
        return a.slice(0, idx).concat([{ ...a[idx], value: val.join(' ') }], a.slice(idx + 1));
      }
    }
  };
  let population = initPool(() => initial || [genStyle()]);
  return async function runEpoch() {
    const startTime = performance.now();
    population = await evolvePool(population, fitnessFunc, mutateFunc);
    const best = _.first(population.pool);
    const worst = _.last(population.pool);
    const style = pre + renderCSS(defaultPrePostPost.concat(best.genes));
    const res = {
      best,
      style,
      scores: [best.score, worst.score],
      time: performance.now() - startTime
    };
    return res;
  };
}
