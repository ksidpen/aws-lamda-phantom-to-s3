const fs = require('fs');
const path = require('path');
const os = require('os')
const execFile = require('child_process').execFile;
const crypto = require('crypto');
const platform = os.platform();

const renderScriptPath = 'phantom-renderscript.js';
const binaryName = `phantomjs-${((platform === 'darwin') ? 'macosx' : 'linux')}`;
const phantomjs = path.resolve(`bin/${binaryName}`);


export const print = async (event, context, callback) => {

  const body = event.body;
  if (!body.html) {
    const err = 'html parameter is undefined';
    return callback(err, {
      statusCode: 500,
      body: JSON.stringify({
        'error': err
      })
    });
  }

  const html = body.html;
  const randomId = crypto.createHash('md5').update(context.logStreamName).digest('hex');
  const options = body.options || {};
  options.viewportSize = options.viewportSize || {};
  options.paperSize = options.paperSize || {};
  options.settings = options.settings || {};
  options.fitToPage = options.fitToPage || false;
  options.waitForJSVarName = options.waitForJSVarName || 'PHANTOM_HTML_TO_PDF_READY';
  options.injectJs = options.injectJs || [];
  options.cookies = options.cookies || [];
  options.format = options.format || 'pdf';

  const inputFilePath = `${randomId}.html`;
  options.input = inputFilePath;
  const outputFilePath = `${randomId}.${options.format}`;
  options.output = outputFilePath;

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


export const printToBucket = async  (event, context, callback) => {

};


export const getFromBucket = async  (event, context, callback) => {

};
