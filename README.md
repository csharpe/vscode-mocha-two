# Mocha2
This is an actively developed version of Mocha and Mocha-Latte VSCode plugins.

Runs Mocha tests, all or selected. Then prints the result to an output window.

This is a maintained, bugfixed fork of the Mocha extension.  Unlike the original, it also works on Mac and Linux.  To use "Mocha Latte", uninstall the "Mocha" extension.

This extension is inspired by [Node.js Tools for Visual Studio](https://github.com/Microsoft/nodejstools).

![Demo showing Mocha test result](https://raw.githubusercontent.com/cspotcode/vscode-mocha-latte/master/demo.png)

## Usage
To run Mocha tests:
* Bring up Command Palette (`F1`, or `Ctrl+Shift+P` on Windows and Linux, or `Shift+CMD+P` on OSX)
* Type or select "Mocha: Run all tests"

You can run tests by:
* All tests in the workspace
* All or failed tests in last run
* Tests that match a Regular Expression
* Tests that the current cursor position (or the current file)
* One test that you pick from a list

### How it works
By default, this extensions will discover tests by searching for `test/**/*.js` under your workspace.

Because your tests may requires a newer version of Node.js than the one powering Visual Studio Code, thus, this extension will attempt to find your installed Node.js and use it for your tests. It will search for the installed Node.js as indicated by environmental variable `PATH`. You can find the logic [here](https://github.com/MystK/vscode-mocha-two/blob/master/fork.js).

When the test is being run, we will add `NODE_PATH` to point to your workspace `node_modules` folder to help [resolving external modules](https://nodejs.org/api/modules.html#modules_loading_from_the_global_folders).

When you ask to run the test under cursor position, the extension will parse the current file and look for matching tests or suites.
If the file contains tests or suites defined using template strings or via dynamic generation, the regular expression `(.+)` will be used as a placeholder in order to have a better matching without having to evaluate the file twice.
This implies that more tests than expected might be run.

## Fit yourself

No one shoe could fit everyone. You may need to turn some switches on to fit your project. Please [file us](https://github.com/MystK/vscode-mocha-two/issues/new/) an issue if you think there is a better way to fit you and the others.

### Configuring Mocha options
Under File > Preferences > Workspace Settings, you can configure [Mocha options](https://github.com/mochajs/mocha/blob/master/lib/mocha.js), e.g. run in "tdd" mode, detect/ignore leaks, etc.

```
//-------- Mocha options --------

// Mocha: Options to run Mocha
"mocha.options": {},

// Mocha: Glob to search for test files
"mocha.files.glob": "test/**/*.js",

// Mocha: Globs to ignore when searching for test files
"mocha.files.ignore": [
  "**/.git/**/*",
  "**/node_modules/**/*"
],

// Mocha: Environment variables to run your tests
"mocha.env": {},

// Mocha: Options to pass to node executable
"mocha.node_options": [],

// Mocha: Subdirectory in the Workspace where run mocha from
"mocha.subfolder": "",

// Mocha: List of files to require before running mocha
"mocha.requires": [],
```

### Setting a keyboard shortcut

To quickly run tests, you can create a keyboard shortcut under File > Preferences > Keyboard Shortcuts. For example, the following JSON will run all tests with `CTRL+K` followed by `R` key.
```
{
  "key": "ctrl+k r",
  "command": "mocha.runAllTests"
}
```

Following commands are also supported:

| Command | Title |
|---------|-------------|
| `mocha.runAllTests` | Mocha: Run all tests |
| `mocha.runFailedTests` | Mocha: Run failed tests |
| `mocha.runLastSetAgain` | Mocha: Run last set again |
| `mocha.runTestAtCursor` | Mocha: Run tests matching the current cursor position or the current active file |
| `mocha.runTestsByPattern` | Mocha: Run tests matching a pattern |
| `mocha.selectAndRunTest` | Mocha: Select and run a test |

## Contributions
Love this extension? [Star](https://github.com/MystK/vscode-mocha-two/stargazers) us and rate us!

Want to make this extension even more awesome? [Send us your wish](https://github.com/MystK/vscode-mocha-two/issues/new/).

Hate how it is working? [File an issue](https://github.com/MystK/vscode-mocha-two/issues/new/) to us.
