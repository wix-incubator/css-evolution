const http = require('http');
const evolve = require('./index');

function err(res, msg) {
    console.error({msg});
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain');
    res.write(msg);
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET') {
    err(res, 'Only POST method is supported')
  } else if (req.method === 'POST') {
    let body = '';
    req.on('data', function(chunk) {
      body += chunk;
    });
    req.on('end', async function() {
        try {
            console.log(body);
            const data = JSON.parse(body);
            data.timeout = data.timeout || 10000;
            console.log(data, {writeHead: res.writeHead});
            const results = await evolve(data);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(results));
        } catch (e) {
            err(res, `Error:${e.toString()}`)
        }
    });
  }
});

server.listen(8000);
console.log('waiting for evolution');
