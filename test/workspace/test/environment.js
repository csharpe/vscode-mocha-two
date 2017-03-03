'use strict';

const
  assert = require('assert');

describe('When environment variable is set in settings', function () {
  it('should run with them', function () {
    assert(process.env.HELLO_WORLD, 'Hello, World!');
  });
});

it('should inherit environment variables', function () {
  // Should cover Linux/Mac and Windows
  assert(process.env.HOME || process.env.PATHEXT);

  // Once I figure out how to pass env variables to the extension host process,
  // we can do this:
  // assert(process.env.INHERITED_ENV_VAR == 'inherited');
});
