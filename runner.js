const AWS = require('aws-sdk');
const lambda = new AWS.Lambda({
  apiVersion: '2015-03-31',
  region: 'us-east-1',
  endpoint: 'https://lambda.us-east-1.amazonaws.com',
  logger: console
});

const fs = require('fs');
const util = require('util');

const readFile = util.promisify(fs.readFile);
const appendFile = util.promisify(fs.appendFile);

const args = process.argv.slice(2);

async function readFileMaybe(filename) {
  try {
    const buffer = await readFile(filename);
    return buffer.toString();
  } catch (e) {
    return null;
  }
}

function sortCompare(a, b) {
  if (a.scores[0] < b.scores[0]) {
    return -1;
  } else if (a.scores[0] === b.scores[0]) {
    return 0;
  }
  return 1;
}

function bestResult(results) {
  if (!results) {
    return null;
  }
  results = results
    .split('\n')
    .map(line => line.trim())
    .filter(t => t)
    .map(line => JSON.parse(line));
  results = results.sort(sortCompare);
  console.log('best score so far:', results[0].scores[0])
  return results[0].best.genes;
}

function invokeLambda(server, payload) {
  return new Promise((resolve,reject) => {
    lambda.invoke({
      FunctionName: server,
      Payload: JSON.stringify(payload)
    }, (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(JSON.parse(data.Payload))
        }
      })
    })
}

async function evolve(server, filename, threads = 20, timeout = 10000) {
  const data = JSON.parse(await readFileMaybe(filename));
  const initial = bestResult(await readFileMaybe(`${filename}.results`));
  const requests = new Array(threads).fill(0).map(() => invokeLambda(server, { ...data, timeout, initial }))
  const res = await Promise.all(requests);
  appendFile(`${filename}.results`, res.map(val => JSON.stringify(val) + '\n').join(''));
}

evolve(...args);
