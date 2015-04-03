"use strict";

var fs = require( "fs" )
  , psTree = require( "ps-tree" )
  , moduleConfig = require( "./config" )
  , pid = null
  ;

var _startTask = function ( mimosaConfig, options, next ) {
  var exec = require("child_process").exec
    , nextCalled = false
    ;

  var startWith = mimosaConfig.buildTask.startWith;
  if ( !startWith ) {
    // using node + path
    if ( !fs.existsSync( mimosaConfig.buildTask.pathFull ) ) {
      // no Task available
      mimosaConfig.log.info( "Could not find file at path [[ " + mimosaConfig.buildTask.pathFull + " ]], so will not attempt to start task." );
      return next();
    }
    startWith = "node " + mimosaConfig.buildTask.pathFull;
  }

  mimosaConfig.log.info("Starting build task...");
  var child = exec( startWith );
  pid = child.pid;

  if (typeof mimosaConfig.buildTask.startedWhen === "string") {
    var outData = ""
      , errData = ""
      ;

    var callNext = function( str ) {
      if (!nextCalled) {
        if (str.indexOf(mimosaConfig.buildTask.startedWhen) > -1) {
          nextCalled = true;
          mimosaConfig.log.info("Build task started.");
          next();
        }
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
      if ( mimosaConfig.buildTask.finishes ) {
        // task finishes on its own, so just "next"
        if (!nextCalled) {
          next();
          nextCalled = true;
        }
      } else {
        if (!nextCalled) {
          console.error( "Task ended unexpectedly, exiting build..." );
          process.exit(1);
        }
      }
    });

  } else {
    // is number for timeout
    setTimeout(function() {
      next();
    }, mimosaConfig.buildTask.startedWhen );
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
    mimosaConfig.log.info("Build task stopped...");
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
