const imageURLs = {};
window.imageURLs = imageURLs;

export function preLoadDataURL(url) {
  if (imageURLs[url]) {
    return Promise.resolve(imageURLs[url]);
  }
  return new Promise(resolve => {
    const request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'blob';
    request.onload = function() {
      const reader = new FileReader();
      reader.readAsDataURL(request.response);
      reader.onload = function(e) {
        imageURLs[url] = e.target.result;
        resolve(imageURLs[url]);
      };
    };
    request.send();
  });
}

export function getImgUrl(offsetWidth, offsetHeight, html, css) {
  css = css.replace(/url\("?([^")]*)"?\)*?\)/g, (matches, url) => `url(${imageURLs[url]})`);
  // console.log(css);
  const data = `
    <svg  xmlns="http://www.w3.org/2000/svg">
    <style>
            #container > div {
              position: absolute;
              width: ${offsetWidth}px;
              height: ${offsetHeight}px;
              top: 20px;
              left: 20px;
              bottom: 20px;
              right: 20px;
            }
            #container {
              width: ${offsetWidth + 40}px;
              height: ${offsetHeight + 40}px;
              position: relative;
            }
            ${css}
          </style>
          <foreignObject width="${offsetWidth + 40}" height="${offsetHeight + 40}">
        <div xmlns="http://www.w3.org/1999/xhtml">
          <div id="container">
            ${html}
          </div>
        </div>
      </foreignObject>
    </svg>`;
  const url = 'data:image/svg+xml;base64,' + btoa(data);
  return url;
}

function getCanvas(offsetWidth, offsetHeight) {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(offsetWidth, offsetHeight);
  } else {
    const canvas = document.createElement('canvas');
    canvas.style = `width:${offsetWidth}px;height:${offsetHeight};`;
    return canvas;
  }
}

export function getPixels(offsetWidth, offsetHeight, html, css) {
  return new Promise(resolve => {
    const canvas = getCanvas(offsetWidth + 40, offsetHeight + 40);
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const url = getImgUrl(offsetWidth, offsetHeight, html, css);
    window.url = url;
    img.onload = function() {
      ctx.drawImage(img, 0, 0);
      const DOMURL = window.URL || window.webkitURL || window;
      const pixels = ctx.getImageData(0, 0, offsetWidth + 40, offsetHeight + 40);
      DOMURL.revokeObjectURL(url);
      img.onload = null;
      resolve(pixels);
    };
    img.src = url;
  });
}

function diffChannel(valA, alphaA, valB, alphaB) {
  valA = valA/255.0;
  valB = valB/255.0;
  // const dBlack = Math.abs(valA * alphaA - valB * alphaB);
  // const dWhite = Math.abs(valA * alphaA + (1-alphaA) - valB * alphaB + (1-alphaB))
  // return dBlack + dWhite;
  return Math.max(Math.pow(valA-valB,2), Math.pow(valA-valB - alphaA + alphaB,2.0));
}

export function matchImages(imgA, imgB) {
  const bufA = imgA.data;
  const bufB = imgB.data;
  if (bufA.length !== bufB.length) {
    throw new Error("length mismatched")
  }
  let diff = 0;
  for (let i = 0; i < bufA.length; i+=4) {
    const a1 = bufA[i+3]/255.0;
    const a2 = bufB[i+3]/255.0;
    diff += diffChannel(bufA[i],a1,bufB[i], a2) +  diffChannel(bufA[i+1],a1,bufB[i+1], a2)+  diffChannel(bufA[i+2],a1,bufB[i+2], a2)
    // diff += bufA[i] === bufB[i+0] ? 0 :1;
    // diff += bufA[i+1] === bufB[i+1] ? 0 :1;
    // diff += bufA[i+2] === bufB[i+2] ? 0 :1;
    // diff += bufA[i+3] === bufB[i+3] ? 0 :1;
  }
//   diff = bufA.length - diff;
//   console.log(diff);
  return diff;
}