"use strict";

var path = require( "path" );

exports.defaults = function() {
  return {
    buildTask: {
      path: "dist/app.js",
      startWith: null,
      startedWhen: "server listening",
      finishes: false
    }
  };
};

exports.validate = function ( config, validators ) {
  var errors = [];

  if ( validators.ifExistsIsObject( errors, "buildTask config", config.buildTask ) ) {
    if ( validators.ifExistsIsString( errors, "buildTask.path", config.buildTask.path ) ) {
      config.buildTask.pathFull = path.join( config.root, config.buildTask.path );
    }

    validators.ifExistsIsString( errors, "buildTask.startWith", config.buildTask.startWith );

    if ( config.buildTask.path && config.buildTask.startWith ) {
      errors.push( "Cannot have both buildTask.path and buildTask.startWith, must have one or the other ");
    }

    var startedWhen = config.buildTask.startedWhen;
    if (!startedWhen) {
      errors.push( "buildTask.startedWhen is required" );
      var type = typeof startedWhen;
      if ( ["string", "number", "boolean"].indexOf( type ) === -1 ) {
        errors.push( "buildTask.startedWhen should be a string, number or boolean." );
      } else {
        if ( type === "boolean" && !startedWhen ) {
          // set flag that indicates the task ends on its own
          config.buildTask.finishes = true;
        }
      }
    }
  }

  return errors;
};
