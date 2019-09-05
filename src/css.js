import { pickRandomFromArray, genPickRandom } from './random';
import { preLoadDataURL } from './pixels';
import _ from 'lodash';
const urlRegex = /^url\("(.*)"\)$/;

export async function extractCSSConsts(cssElement) {
  const styleObjects = Array.from(cssElement.sheet.rules)
    .map(rule => rule.style)
    .map(style => Array.from(style).reduce((acc, k) => ({ ...acc, [k]: style[k] }), {}));
  const allValuesPerKey = styleObjects.reduce((acc, style) => {
    Object.keys(style).forEach(prop => (acc[prop] = (acc[prop] || new Set()).add(style[prop])));
    return acc;
  }, {});
  console.log(allValuesPerKey);
  const allValues = new Set(
    Object.values(allValuesPerKey)
      .map(set => Array.from(set))
      .flat()
  );
  const sizes = new Set(Array.from(allValues).filter(value => value.match(/^\-?\d+(\.\d+)?(px|em|rem|\%)$/)));
  const colorsAndImages = Object.keys(allValuesPerKey)
    .filter(propName => propName.includes('color') || propName.includes('image'))
    .map(propName => Array.from(allValuesPerKey[propName]))
    .flat();
  const colors = Array.from(new Set(colorsAndImages.filter(v => !urlRegex.test(v)))).map(t => t.replace(/ /g,''));
  const urls = Array.from(new Set(colorsAndImages.filter(v => urlRegex.test(v))));
  console.log(allValues);
  console.log({ colors, sizes });
  const imgUrls = urls.map(v => v.replace(urlRegex, '$1'));
  await Promise.all(imgUrls.map(v => preLoadDataURL(v)));
  console.log('urls:', urls);
  sizes.delete('');
  sizes.delete('0');
  sizes.add('0px');
  return { colors, urls, sizes: Array.from(sizes) };
}

export const absoluteCoverPosition = {
  type: 'position',
  value:`absolute; left:0; top:0; bottom:0; right:0`
}

export const contentEmpty = {
  type: 'content',
  value: '""'
}

export function createGenerateRandomStyle({ sizes, colors, urls, classNames }) {
  // console.log(colors,urls);
  const randomColor = pickRandomFromArray.bind(null, colors);
  const randomSize = pickRandomFromArray.bind(null, sizes);
  const randomUrl = pickRandomFromArray.bind(null, urls);
  const randomHorizontalPosition = pickRandomFromArray.bind(null, ['left', 'right', 'center']);
  const randomVerticalPosition = pickRandomFromArray.bind(null, ['top', 'center', 'bottom']);
  const randomBackgroundSizePart = pickRandomFromArray.bind(null, sizes.concat('auto'));
  const randomBackgroundSize = () => randomBackgroundSizePart() + ' ' + randomBackgroundSizePart()
  const randomRepeat = pickRandomFromArray.bind(null, ['repeat', 'no-repeat', 'repeat-x', 'repeat-y']);

  const randomType = genPickRandom({
    background: 25,
    'background-color': 1,
    'border-radius': 5,
    'box-shadow': 10,
    'border': 5,
    'margin': 2,
    position: 5,
  });
  const randomSelector = genPickRandom(
    classNames.reduce(
      (acc, v) => ({
        ...acc,
        [v]: 3,
        // [`${v}::before`]: 1,
        // [`${v}::after`]: 1
      }),
      {}
    )
  );

  const removeFromNonPseudo = {
    'position': true,
    'margin': true
  }

  function generateRandomStyle(type, selector) {
    selector = selector || randomSelector();

    while (!type) {
      type = randomType();
      if (removeFromNonPseudo[type] && selector.indexOf(':') === -1) {
        type = null;
      }
    }
    // console.log(type, selector);
    switch (type) {
      case 'border-radius':
      case 'margin':
              return { type, selector, value: [randomSize(), randomSize(), randomSize(), randomSize()].join(' ') };
      case 'box-shadow':
          return { type, selector, value: [randomSize(), randomSize(),randomSize(), randomSize(), randomColor()].join(' ') };
      case 'border':
          return { type, selector, value: [randomSize(), randomSize(),randomSize(), randomSize(), randomColor(), 'solid', randomColor()].join(' ') };
      case 'background-color':
        return { type, selector, value: randomColor() };
      case 'position':
        return {type, selector, value: 'absolute; left:${randomSize()}; top:${randomSize()}; bottom:${randomSize()}; right:${randomSize}'}
      case 'background':
        return {
          type,
          selector,
          value: [
            randomUrl(),
            randomHorizontalPosition(),
            randomSize(),
            randomVerticalPosition(),
            randomSize(),
            '/',
            randomBackgroundSize(),
            randomRepeat(),
          ].join(' ')
        };
    }
  }

  return generateRandomStyle;
}

const supportsMultiples = {
  'background': true,
  'box-shadow': true
}

export function renderCSS(styles) {
  styles = styles || [];

  
  const stylesBySelectors = _.groupBy(styles, 'selector');
  const stylesTextBySelector = _.map(stylesBySelectors, (rules, selector) => {
    const stylesByType = _(rules)
      .groupBy('type')
      .mapValues((rules, type) => supportsMultiples[type] ? rules : [rules[rules.length-1]])
      .value();
    if (stylesByType['background-color']) {
      stylesByType.background = stylesByType.background || [];
      stylesByType.background.push(stylesByType['background-color'][0])
      delete stylesByType['background-color']
    }
    const rulesAsText = _.map(stylesByType, (rules, type) => `
      ${type}:${_.map(rules,'value').join(',')};`)
    // console.log(rulesAsText);
    return `.${selector} {${rulesAsText.join('')}}`
  })
  // console.log(stylesTextBySelector.join('\n'))
  return stylesTextBySelector.join('\n');
}

const CSS_PART_REGEX = /\s*([{;}])\s*/gm;
 
export function pretty(css) {
  return css.replace(CSS_PART_REGEX, (_match, char) => (char.length > 1 ? '\n' : '') +` ${char}
  `);
}