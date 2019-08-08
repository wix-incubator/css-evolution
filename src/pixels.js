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
//    <rect x="0" y="0" width="100%" height="100%"/>

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
              background: #777;
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
  // console.log(data);
  const url = 'data:image/svg+xml;base64,' + btoa(data);
  return url;
}
// const canvas = document.createElement('canvas');
// window.document.body.appendChild(canvas)

export function getPixels(offsetWidth, offsetHeight, html, css) {
  return new Promise(resolve => {
    const canvas = document.createElement('canvas');
    canvas.style=`width:${offsetWidth + 40}px;height:${offsetHeight + 40}px;`
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const url = getImgUrl(offsetWidth, offsetHeight, html, css);
    window.url = url;
    // console.log(url);
    img.onload = function() {
      ctx.drawImage(img, 0, 0);
      const DOMURL = window.URL || window.webkitURL || window;
      const pixels = ctx.getImageData(0, 0, offsetWidth + 40, offsetHeight + 40);
      DOMURL.revokeObjectURL(url);
      resolve(pixels);
    };
    img.src = url;
    window.document.body.lastChild.NO

  });
}

export function matchImages(imgA, imgB) {
  const bufA = imgA.data;
  const bufB = imgB.data;
  if (bufA.length !== bufB.length) {
    throw new Error("length mismatched")
  }
  let diff = 0;
  for (let i = 0; i < bufA.length; i+=4) {
    diff = diff + (Math.abs(bufA[i] - bufB[i])/1024.0);
    diff = diff + (Math.abs(bufA[i+1] - bufB[i+1])/1024.0);
    diff = diff + (Math.abs(bufA[i+2] - bufB[i+2])/1024.0);
    diff = diff + (Math.abs(bufA[i+3] - bufB[i+3])/256.0);
  }
//   diff = bufA.length - diff;
//   console.log(diff);
  return diff;
}