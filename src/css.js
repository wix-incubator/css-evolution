import { pickRandomFromArray, genPickRandom } from './random';
import { preLoadDataURL } from './pixels';

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
  const colors = Array.from(new Set(colorsAndImages.filter(v => !urlRegex.test(v))));
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

export function createGenerateRandomStyle({ sizes, colors, urls, classNames }) {
  // console.log(colors,urls);
  const randomColor = pickRandomFromArray.bind(null, colors);
  const randomSize = pickRandomFromArray.bind(null, sizes);
  const randomUrl = pickRandomFromArray.bind(null, urls);
  const randomHorizontalPosition = pickRandomFromArray.bind(null, ['left', 'right', 'center']);
  const randomVerticalPosition = pickRandomFromArray.bind(null, ['top', 'center', 'bottom']);
  const randomBackgroundSizePart = pickRandomFromArray.bind(null, sizes.concat('auto'));
  const randomBackgroundSize = () => randomBackgroundSizePart() + ' ' + randomBackgroundSizePart();
  const randomRepeatPart = () => 'no-repeat'; //pickRandomFromArray.bind(null, ['repeat', 'space', 'round', 'no-repeat']);

  const randomType = genPickRandom({
    background: 10,
    'background-color': 1,
    'border-radius': 1,
    position: 1,
    left: 1,
    right: 1,
    top: 1,
    bottom: 1
  });
  const randomSelector = genPickRandom(
    classNames.reduce(
      (acc, v) => ({
        ...acc,
        [v]: 3,
        [`${v}::before`]: 1,
        [`${v}::after`]: 1
      }),
      {}
    )
  );

  function generateRandomStyle() {
    const type = randomType();
    const selector = randomSelector();
    switch (type) {
      case 'left':
      case 'right':
      case 'top':
      case 'bottom':
          return { type, selector, value: randomSize() };

      case 'border-radius':
          return { type, selector, value: [randomSize(),randomSize(),randomSize(),randomSize()].join(' ') };

      case 'background-color':
        return { type, selector, value: randomColor() };
      case 'position':
        return {type, selector, value: 'absolute'}
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
            randomRepeatPart(),
            randomRepeatPart()
          ].join(' ')
        };
    }
  }

  return generateRandomStyle;
}

export function renderCSS(styles) {
  styles = styles || [];
  
  const stylesBySelectors = styles.reduce((acc, style) => {
    acc[style.selector] = acc[style.selector] || [];
    acc[style.selector].push(style);
    return acc;
  }, {});
  return Object.keys(stylesBySelectors).reduce((acc, selector) => {
    const stylesInSelector = stylesBySelectors[selector];

    const joinedStyles = stylesInSelector.reduce((acc, styleRule) => {
      if (acc[styleRule.type] && styleRule.type === 'background') {
        acc[styleRule.type] += ',';
      } else {
        acc[styleRule.type] = '';
      }
      acc[styleRule.type] += styleRule.value;
      return acc;
    }, {});

    if (joinedStyles['background-color'] && joinedStyles.background) {
      joinedStyles.background += ', ' + joinedStyles['background-color'];
      delete joinedStyles['background-color'];
    }
    return (
      acc +
      `.${selector} {${Object.keys(joinedStyles).map(
        type => `
${type}: ${joinedStyles[type]};`
      )}
        }`
    );
  }, '');
}
