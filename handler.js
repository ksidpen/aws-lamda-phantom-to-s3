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

const printToFile = async(args, context) => {
  const html = args.html;
  const randomId = crypto.createHash('md5').update(context.logStreamName).digest('hex');
  const options = args.options || {};
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

  const encodedOptions = JSON.stringify(options);

  await writeFile(inputFilePath, html);
  await execFile(phantomjs, [renderScriptPath, null, encodedOptions]);
  return readFile(outputFilePath);
}

const report = (err, callback) => {
  callback(err, {
    statusCode: 500,
    body: JSON.stringify({
      'error': err
    })
  });
}

export const print = async(event, context, callback) => {

  const body = event.body;
  if (!body.html) {
    return report('html parameter is undefined', callback)
  }

  try {
    const output = await printToFile(body, context);
    callback(null, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: output.toString('base64')
    });
  } catch (err) {
    return report(err, callback)
  }
};


export const printToBucket = async(event, context, callback) => {
  const body = event.body;
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
          if (err)
            reject(err)

          resolve(data);
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
  const body = event.body;
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
        if (err)
          reject(err)

        resolve(data);
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
