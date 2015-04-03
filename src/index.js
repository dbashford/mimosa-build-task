"use strict";

var fs = require( "fs" )
  , psTree = require( "ps-tree" )
  , moduleConfig = require( "./config" )
  , pid = null
  ;

var _startProcess = function( mimosaConfig ) {
  var exec = require("child_process").exec
    , startWith = mimosaConfig.buildTask.startWith
    ;

  if ( !startWith ) {
    // using node + path
    if ( !fs.existsSync( mimosaConfig.buildTask.pathFull ) ) {
      // no Task available
      mimosaConfig.log.info( "Could not find file at path [[ " + mimosaConfig.buildTask.pathFull + " ]], so will not attempt to start task." );
      return null;
    }
    startWith = "node " + mimosaConfig.buildTask.pathFull;
  }

  mimosaConfig.log.info("Running build task...");
  return exec( startWith );
};

var _monitorProcess = function( mimosaConfig, next, child ) {
  var outData = ""
    , errData = ""
    , nextCalled = false
    ;

  var callNext = function( str ) {
    // if the task doesn't finish on its own
    // and next hasn't already been called
    // and the startedWhen text has been found
    if (!nextCalled && str.indexOf( mimosaConfig.buildTask.startedWhen ) > -1 ) {
      nextCalled = true;
      mimosaConfig.log.info("Build task started.");
      next();
    }
  };

  child.stdout.on( "data", function( data ) {
    console.log( data );
    outData += data;
    callNext( outData );
  });

  child.stderr.on( "data", function( data ) {
    console.error( data );
    errData += data;
    callNext( errData );
  });

  child.on("close", function() {
    if (!nextCalled) {
      console.error( "Task ended unexpectedly, exiting build..." );
      process.exit(1);
    }
  });
};

var _waitForProcessEnd = function( mimosaConfig, next, child ) {
  // task ends itself, just wait for it
  child.stdout.on( "data", function( data ) {
    console.log( data );
  });
  child.stderr.on( "data", function( data ) {
    console.error( data );
  });
  child.on("close", function() {
    mimosaConfig.log.info("Build task ended.");
    next();
  });
};

var _startTask = function ( mimosaConfig, options, next ) {
  var childProcess = _startProcess( mimosaConfig );
  if ( !childProcess ) {
    return next();
  }

  pid = childProcess.pid;

  if (typeof mimosaConfig.buildTask.startedWhen === "string") {
    // need to monitor process for specific stdout output
    _monitorProcess( mimosaConfig, next, childProcess );
  } else {
    if ( mimosaConfig.buildTask.finishes ) {
      // process will end on its own
      _waitForProcessEnd( mimosaConfig, next, childProcess );
    } else {
      // is number for timeout
      setTimeout( function() {
        mimosaConfig.log.info("Build task timeout parameter hit, continuing build.");
        next();
      }, mimosaConfig.buildTask.startedWhen );
    }
  }
};

var _stopTask = function ( mimosaConfig, options, next ) {

  // no task was started
  if ( !pid ) {
    return next();
  }

  mimosaConfig.log.info("Stopping build task...");
  psTree( pid, function ( err, children ) {
    [pid].concat( children.map( function ( p ) {
      return p.PID;
    })).forEach( function ( tpid ) {
      try {
        process.kill( tpid );
      } catch (ex) { }
    });
    mimosaConfig.log.info("Build task stopped.");
    next();
  });
};

var registration = function (config, register) {
  if ( config.isBuild ) {
    register( ["postBuild"], "afterPackage", _startTask );

    if ( !config.buildTask.finishes ) {
      // register stop task because task doesn't stop on its own
      register( ["postBuild"], "complete", _stopTask );
    }
  }
};

module.exports = {
  registration: registration,
  defaults: moduleConfig.defaults,
  validate: moduleConfig.validate
};
