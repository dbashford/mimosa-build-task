mimosa-build-task
===========

## Overview

This module will run a node script or a script of your own during Mimosa's `build` process.  The initial use case for this module was to start a  server during a CI build so tests can be run against it, and this module's default settings support that use case.  But this module is flexible enough to run any script you want.

For more information regarding Mimosa, see http://mimosa.io

## Usage

Add `'build-task'` to your list of modules.  That's all!  Mimosa will install the module for you when you start `mimosa watch` or `mimosa build`.

## Functionality

During `mimosa build` this module will either run node pointed at a file of your choosing (like a server), or anything else using a command you provide.  It will also keep track of the processes that your task starts and shut them down if needed.  This module runs your task after Mimosa's build packaging steps have completed, and will shut down the processes created by your tasks when the build completes.

## Default Config

```javascript
buildTask: {
  path: "dist/app.js",
  startWith: null,
  startedWhen: "server listening"
}
```

The defaults all correspond with starting a server as if it has been packaged via [mimosa-web-package](https://github.com/dbashford/mimosa-web-package).

#### `path` string
The path to a node file to run as your build task.  `path` is relative to the root of the project.  If `path` is provided, `startWith` cannot also be provided.

#### `startWith` string
The command to run to start the build task.  The command is relative to the root of the project.  If `startWith` is provided, `path` cannot also be provided.

#### `startedWhen` string, number, boolean
`startedWhen` indicates when the task has fully completed/started so that it can proceed with the rest of the build.  If `startedWhen` is a string, then when that string is found in the `stdout`/`stderr` output of the task being run, this module will proceed with the build.  If `startedWhen` is a number, then the build will continue after a `setTimeout` using that number as the duration.  If `startedWhen` is set to `false`, then the build will continue when the task itself completes.  Some tasks are persistent (like a server) in which case a string is optimal.  If the task is persistent but there is no output, or the output cannot be relied upon, use the timeout number.  If the task ends on its own, set this to `false`.