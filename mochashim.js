'use strict';

const
  config = require('./config'),
  fork = require('./fork'),
  path = require('path'),
  Promise = require('bluebird'),
  vscode = require('vscode');

function envWithNodePath(rootPath) {
  return Object.assign({}, process.env, {
    NODE_PATH: `${rootPath}${path.sep}node_modules`
  }, config.env());
}

function applySubdirectory(rootPath){
  const subdirectory = config.subdirectory()

  if(subdirectory)
    rootPath = path.resolve(rootPath, subdirectory);

  return rootPath;
}

function stripWarnings(text) { // Remove node.js warnings, which would make JSON parsing fail
  return text.replace(/\(node:\d+\) DeprecationWarning:\s[^\n]+/g, "");
}

let terminalEventSet = {};
let terminals = {}
function runTests(testFiles, grep, messages) {
  terminals[grep] = terminals[grep] || vscode.window.createTerminal({ name: grep });
  terminals[grep].show(true)
  terminals[grep].sendText(`node node_modules/mocha/bin/_mocha --opts mocha.opts ./**/*.spec.js --grep "${grep}"`)
  if (!terminalEventSet[grep]) {
    vscode.window.onDidCloseTerminal(terminalClosed => {
      console.log(terminalClosed);
      if (terminals[terminalClosed.name]) {
        terminals[terminalClosed.name] = null;
        terminalEventSet[terminalClosed.name] = false;
      }
    });
    terminalEventSet[grep] = true;
  }
}

function findTests(rootPath) {
  // Allow the user to choose a different subfolder
  rootPath = applySubdirectory(rootPath);

  return fork(
    path.resolve(module.filename, '../worker/findtests.js'),
    [
      JSON.stringify({
        options: config.options(),
        files: {
          glob: config.files().glob,
          ignore: config.files().ignore
        },
        requires: config.requires(),
        rootPath
      })
    ],
    {
      env: envWithNodePath(rootPath)
    }
  ).then(process => new Promise((resolve, reject) => {
    const
      stdoutBuffers = [],
      resultJSONBuffers = [];

    process.stderr.on('data', data => {
      resultJSONBuffers.push(data);
    });

    process.stdout.on('data', data => {
      stdoutBuffers.push(data);
    });

    process
      .on('error', err => {
        vscode.window.showErrorMessage(`Failed to run Mocha due to ${err.message}`);
        reject(err);
      })
      .on('exit', code => {
        console.log(Buffer.concat(stdoutBuffers).toString());

        const stderrText = Buffer.concat(resultJSONBuffers).toString();
        let resultJSON;

        try {
          resultJSON = stderrText && JSON.parse(stripWarnings(stderrText));
        } catch (ex) {
          code = 1;
        }

        if (code) {
          const outputChannel = vscode.window.createOutputChannel('Mocha');

          outputChannel.show();
          outputChannel.append(stderrText);
          console.error(stderrText);

          reject(new Error('unknown error'));
        } else {
          resolve(resultJSON);
        }
      });
  }));
}

module.exports.runTests = runTests;
module.exports.findTests = findTests;
