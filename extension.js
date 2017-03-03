'use strict';

const
  ChildProcess = require('child_process'),
  config = require('./config'),
  escapeRegExp = require('escape-regexp'),
  fs = require('fs'),
  Glob = require('glob').Glob,
  parser = require('./parser'),
  path = require('path'),
  Promise = require('bluebird'),
  Runner = require('./runner'),
  vscode = require('vscode');

const
  access = Promise.promisify(fs.access),
  runner = new Runner();

exports.activate = context => {
  const subscriptions = context.subscriptions;

  subscriptions.push(vscode.commands.registerCommand('mocha.runAllTests', function () {
    if (hasWorkspace()) {
      runAllTests();
    }
  }));

  subscriptions.push(vscode.commands.registerCommand('mocha.runTestAtCursor', function () {
    if (hasWorkspace()) {
      runTestAtCursor();
    }
  }));

  subscriptions.push(vscode.commands.registerCommand('mocha.selectAndRunTest', function () {
    if (hasWorkspace()) {
      selectAndRunTest();
    }
  }));

  subscriptions.push(vscode.commands.registerCommand('mocha.runFailedTests', function () {
    if (hasWorkspace()) {
      runFailedTests();
    }
  }));

  subscriptions.push(vscode.commands.registerCommand('mocha.runTestsByPattern', function () {
    if (hasWorkspace()) {
      runTestsByPattern();
    }
  }));

  subscriptions.push(vscode.commands.registerCommand('mocha.runLastSetAgain', function () {
    if (hasWorkspace()) {
      runLastSetAgain();
    }
  }));
};

function hasWorkspace() {
  const root = vscode.workspace.rootPath;
  const validWorkspace = typeof root === "string" && root.length;

  if(!validWorkspace) {
    vscode.window.showErrorMessage('Please open a folder before trying to execute Mocha.');
  }

  return validWorkspace;
}

function fork(jsPath, args, options) {
  return findNodeJSPath().then(execPath => new Promise((resolve, reject) => {
    resolve(ChildProcess.spawn(
      execPath,
      [ jsPath ].concat(args),
      options
    ))
  }), err => {
    vscode.window.showErrorMessage('Cannot find Node.js installation from environment variable');

    throw err;
  });
}

function runAllTests() {
  runner.loadTestFiles()
    .then(
      files => {
        if (!files.length) {
          return vscode.window.showWarningMessage('No tests were found.');
        }

        runner.runAll();
      }
    ).catch(
      err => vscode.window.showErrorMessage(`Failed to run tests due to ${err.message}`)
    );
}

function runTestAtCursor(){
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    return vscode.window.showErrorMessage('No active editors were found.');
  } else if(editor.document.languageId !== 'javascript') {
    return vscode.window.showErrorMessage('Mocha is only available for JavaScript files.');
  }

  let detectError = 'No test(s) were detected at the current cursor position.';
  let test = null;

  try{
    test = parser.getTestAtCursor(editor.document.getText(), editor.selection.active);
  }catch(e){
    console.error(e);
    detectError = `Parsing failed while detecting test(s) at the current cursor position: ${e.message}`;
  }
  return runner.loadTestFiles()
    .then(() => {
      if (test) {
        return runner.runWithGrep(test.label, editor.document.fileName);
      } else {
        // Only run test from the current file
        const currentFile = editor.document.fileName;
        runner.tests = runner.tests.filter(t => t.file === currentFile);

        return runner.runAll([`WARNING: ${detectError} Running all tests in the current file.`]);
      }
    })
    .catch(err => vscode.window.showErrorMessage(`Failed to run test(s) at the cursor position due to ${err.message}`));
}

function selectAndRunTest() {
  const rootPath = vscode.workspace.rootPath;

  vscode.window.showQuickPick(
    runner.loadTestFiles()
      .then(
        tests => {
          if (!tests.length) {
            vscode.window.showWarningMessage(`No tests were found.`);
            throw new Error('no tests found');
          }

          return tests.map(test => ({
            detail: path.relative(rootPath, test.file),
            label: test.fullName,
            test
          }));
        },
        err => {
          vscode.window.showErrorMessage(`Failed to find tests due to ${err.message}`);
          throw err;
        }
      )
  )
  .then(entry => {
    if (!entry) { return; }

    runner
      .runTest(entry.test)
      .catch(err => {
        vscode.window.showErrorMessage(`Failed to run selected tests due to ${err.message}`);
      });
  });
}

function runFailedTests() {
  runner.runFailed()
    .catch(() => vscode.window.showErrorMessage(`Failed to rerun failed tests due to ${err.message}`));
}

function runTestsByPattern() {
  return Promise.props({
    pattern: vscode.window.showInputBox({
      placeHolder: 'Regular expression',
      prompt: 'Pattern of tests to run',
      value: lastPattern || ''
    }),
    loadTests: runner.loadTestFiles()
  }).then(props => {
    const pattern = props.pattern;

    if (!pattern) return;

    return runner.runWithGrep(pattern);
  }, err => vscode.window.showErrorMessage(`Failed to run tests by pattern due to ${err.message}`));
}

function runLastSetAgain() {
  runner.runLastSet()
}
