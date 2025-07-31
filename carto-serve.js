'use strict';

var argv = require('yargs').argv,
    carto = require('carto'),
    _ = require('lodash'),
    express = require('express'),
    bodyParser = require('body-parser'),
    app = express(),
    port = parseInt(argv.p) ? parseInt(argv.p) : 80;

// Convert a MML JSON document into Mapnik XML. Expects the entire input to be a single XML string.
app.post('/', bodyParser.json({limit: '1mb'}), function(req, res) {
  if (!req.body)
    return res.status(400).send('A valid JSON body is required');

  let renderer =  new carto.Renderer();

  try {
    let xml = renderer.render(req.body);
    res.send(xml);
  }
  catch(e) {
    if (e.toString().match('Invalid code:'))
      res.status(422).send(e.toString());
    else
      res.status(500).send(e);

    console.log(e);
  }
});

// Validate a CartoCSS fragment. Expects the entire input to be a single CartoCSS string.
app.post('/validate', bodyParser.text({limit: '1mb'}), function(req, res) {
  if (!req.body)
    return res.status(400).send('A non-empty string of CartoCSS is required');

  let renderer =  new carto.Renderer();
  try {
    renderer.renderMSS(req.body);
    res.send('success');
  }
  catch(e) {
    let msg = e.toString();
    if (msg.match(/^Error: /)) {

      // Organize errors by line
      let output = {};
      msg.substr('Error: '.length)
        .split('\n')
        .forEach(function(str) {
          if (!str)
            return;

          let [, line, error] = str.match(/^:([0-9]+):[0-9]+ (.*)/);
          if (!(line in output))
            output[line] = [];
          output[line].push(error)
        });

      // Remvoe duplicate messages for each line
      for(let line in output) {
        output[line].sort();
        output[line] = output[line].filter(function(err, i, all) {
          return !(i < all.length-1 && err == all[i+1]);
        });
      }

      res.status(200).json(output);
    } else {
      console.log(e);
      res.status(500).send(e);
    }
  }
});

app.listen(port, function() {
  console.log('Listening on port '+port+'...');
});

process.on('SIGINT', exit);
process.on('SIGTERM', exit);

function exit() {
  process.exit();
}