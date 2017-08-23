'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os')
const execFile = require('child_process').execFile;
const platform = os.platform();

const inputFilePath = 'input.html';
const renderScriptPath = 'phantom-renderscript.js';

module.exports.print = (event, context, callback) => {
  const binaryName = 'phantomjs-' + ((platform === 'darwin') ? 'macosx' : 'linux');
  const phantomjs = path.resolve('bin/' + binaryName);

  const body = event.body;
  const html = body.html;
  const options = body.options || {};
  options.viewportSize = options.viewportSize || {};
  options.paperSize = options.paperSize || {};
  options.settings = options.settings || {};
  options.fitToPage = options.fitToPage || false;
  options.waitForJSVarName = options.waitForJSVarName || 'PHANTOM_HTML_TO_PDF_READY';
  options.injectJs = options.injectJs || [];
  options.cookies = options.cookies || [];
  options.format = options.format || 'pdf';

  options.input = inputFilePath;
  const outputFilePath = 'output.' + options.format;
  options.output = outputFilePath;

  if (!html) {
    const err = 'html parameter is undefined';
    return callback(err, {
      statusCode: 500,
      body: JSON.stringify({
        'error': err
      })
    });
  }

  fs.writeFileSync(inputFilePath, html);

  execFile(phantomjs, [renderScriptPath, null, JSON.stringify(options)],
    (err, stdout, stderr) => {
      if (err) {
        callback(err, {
          statusCode: 500,
          body: JSON.stringify({
            'error': err
          }),
        });
      }

      const output = fs.readFileSync(outputFilePath);
      callback(null, {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: output.toString('base64')
      });
    });

};
