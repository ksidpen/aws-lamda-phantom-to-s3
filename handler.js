const fs = require('fs');
const path = require('path');
const os = require('os')
const childProcess = require('child_process');
const crypto = require('crypto');
const platform = os.platform();

const renderScriptPath = 'phantom-renderscript.js';
const binaryName = `phantomjs-${((platform === 'darwin') ? 'macosx' : 'linux')}`;
const phantomjs = path.resolve(`bin/${binaryName}`);

const promisify = require("es6-promisify");
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const execFile = promisify(childProcess.execFile);

const aws = require('aws-sdk');
const s3 = new aws.S3();
const twemoji = require('twemoji');
const cheerio = require('cheerio');

const prepareOptions = async(args, context) =>{

  var html = args.html;
  html = twemoji.parse(html, {
      folder: '/svg',
      ext: '.svg',
      base: path.resolve('node_modules/twemoji/2')
  });
  const parsedHtml = cheerio.load(html);
  parsedHtml
  ('head')
  .append('<style>img.emoji {height: 1em;width: 1.3em;margin: .1em;vertical-align: text-bottom;}</style>')
  html = parsedHtml.html();

  const fileName = args.id;
  const randomId = crypto
  .createHash('md5')
  .update(fileName || context.logStreamName)
  .digest('hex');
  const options = args.options || {};
  options.id = randomId;
  options.viewportSize = options.viewportSize || {};
  options.paperSize = options.paperSize || {};
  options.settings = options.settings || {};
  options.fitToPage = options.fitToPage || false;
  options.waitForJSVarName = options.waitForJSVarName || 'PHANTOM_HTML_TO_PDF_READY';
  options.injectJs = options.injectJs || [];
  options.cookies = options.cookies || [];
  options.format = options.format || 'pdf';

  const inputFilePath = `/tmp/${randomId}.html`;
  options.input = inputFilePath;
  const outputFilePath = `/tmp/${randomId}.${options.format}`;
  options.output = outputFilePath;

  await writeFile(inputFilePath, html);

  return options;
}

const printToFile = async(args, context) => {
  const options = await prepareOptions(args, context);
  await execFile(phantomjs, [renderScriptPath, null, JSON.stringify(options)]);

  if(options.format!=='pdf')
    return readFile(options.output);

  const ghostscriptOutput = `/tmp/${options.id}-gs.pdf`;
  await execFile('gs', ['-o', ghostscriptOutput, '-sDEVICE=pdfwrite',
  '-dPDFSETTINGS=/prepress', options.output]);

  return readFile(ghostscriptOutput);
}

const report = (err, callback) => {
  callback(err, {
    statusCode: 500,
    body: JSON.stringify({
      'error': err
    })
  });
}

const getRequestBody = (event)=>{
  return (typeof event.body === 'string')? JSON.parse(event.body) : event.body;
}

export const print = async(event, context, callback) => {

  const body = getRequestBody(event);
  if (!body.html) {
    return report('html parameter is undefined', callback)
  }

  try {
    const output = await printToFile(body, context);

    callback(null, {
      statusCode: 200,
      body: output.toString('base64')
    });
  } catch (err) {
    return report(err, callback)
  }
};


export const printToBucket = async(event, context, callback) => {
  const body = getRequestBody(event);
  if (!body.id) {
    return report('id parameter is undefined', callback)
  }

  const fileName = body.id;

  try {
    const fileBuffer = await printToFile(body, context);
    const result = await
    new Promise((resolve, reject) => {
        s3.putObject({
          Key: fileName,
          Body: fileBuffer,
          Bucket: process.env.BUCKET_NAME
        }, (err, data) => {
          (err)? reject(err) : resolve(data);
        });
    })
    callback(null, {
      statusCode: 200,
      body: result
    })
  } catch (err) {
    return report(err, callback)
  }
};


export const getFromBucket = async(event, context, callback) => {
  const body = getRequestBody(event);
  if (!body.id) {
    return report('id parameter is undefined', callback)
  }

  const fileName = body.id;
  try {
    const result = await
    new Promise((resolve, reject) => {
      s3.getSignedUrl('getObject', {
        Bucket: process.env.BUCKET_NAME,
        Key: fileName
      }, (err, data) => {
        (err)? reject(err) : resolve(data);
      })
    })
    callback(null, {
      statusCode: 200,
      body: result
    })
  } catch (err) {
    return report(err, callback)
  }
};
