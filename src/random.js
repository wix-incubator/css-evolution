
export function genPickRandom(keysAndWeights) {
    const keys = Object.keys(keysAndWeights);
    const weights = Object.values(keysAndWeights);
    const subTotals = [];
    weights.forEach((v, i) => subTotals.push(v + (i == 0 ? 0 : subTotals[i - 1])));
    const total = subTotals[subTotals.length - 1];
    return () => {
      let val = Math.random() * total;
      for (let i = 0; i < subTotals.length; i++) {
        val -= subTotals[i];
        if (val < 0) {
          return keys[i];
        }
      }
    };
  }

  export function randomInt(max) {
      return Math.floor(Math.random() * max);
  }
  
  export function pickRandomFromArray(arr) {
    const res = arr[randomInt(arr.length)];
    if (typeof res === 'function') {
      return res();
    }
    return res;
  }