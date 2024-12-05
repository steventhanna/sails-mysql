//  ██████╗ ██████╗  ██████╗  ██████╗███████╗███████╗███████╗    ███████╗ █████╗  ██████╗██╗  ██╗
//  ██╔══██╗██╔══██╗██╔═══██╗██╔════╝██╔════╝██╔════╝██╔════╝    ██╔════╝██╔══██╗██╔════╝██║  ██║
//  ██████╔╝██████╔╝██║   ██║██║     █████╗  ███████╗███████╗    █████╗  ███████║██║     ███████║
//  ██╔═══╝ ██╔══██╗██║   ██║██║     ██╔══╝  ╚════██║╚════██║    ██╔══╝  ██╔══██║██║     ██╔══██║
//  ██║     ██║  ██║╚██████╔╝╚██████╗███████╗███████║███████║    ███████╗██║  ██║╚██████╗██║  ██║
//  ╚═╝     ╚═╝  ╚═╝ ╚═════╝  ╚═════╝╚══════╝╚══════╝╚══════╝    ╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
//
//  ██████╗ ███████╗ ██████╗ ██████╗ ██████╗ ██████╗
//  ██╔══██╗██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔══██╗
//  ██████╔╝█████╗  ██║     ██║   ██║██████╔╝██║  ██║
//  ██╔══██╗██╔══╝  ██║     ██║   ██║██╔══██╗██║  ██║
//  ██║  ██║███████╗╚██████╗╚██████╔╝██║  ██║██████╔╝
//  ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚═════╝
//

var _ = require('@sailshq/lodash');
var utils = require('waterline-utils');
var eachRecordDeep = utils.eachRecordDeep;

module.exports = function processEachRecord(options) {
  //  ╦  ╦╔═╗╦  ╦╔╦╗╔═╗╔╦╗╔═╗  ┌─┐┌─┐┌┬┐┬┌─┐┌┐┌┌─┐
  //  ╚╗╔╝╠═╣║  ║ ║║╠═╣ ║ ║╣   │ │├─┘ │ ││ ││││└─┐
  //   ╚╝ ╩ ╩╩═╝╩═╩╝╩ ╩ ╩ ╚═╝  └─┘┴   ┴ ┴└─┘┘└┘└─┘
  if (_.isUndefined(options) || !_.isPlainObject(options)) {
    throw new Error('Invalid options argument. Options must contain: records, identity, and orm.');
  }

  if (!_.has(options, 'records') || !_.isArray(options.records)) {
    throw new Error('Invalid option used in options argument. Missing or invalid records.');
  }

  if (!_.has(options, 'identity') || !_.isString(options.identity)) {
    throw new Error('Invalid option used in options argument. Missing or invalid identity.');
  }

  if (!_.has(options, 'orm') || !_.isPlainObject(options.orm)) {
    throw new Error('Invalid option used in options argument. Missing or invalid orm.');
  }

  // Key the collections by identity instead of column name
  var collections = _.reduce(options.orm.collections, function(memo, val) {
    memo[val.identity] = val;
    return memo;
  }, {});

  options.orm.collections = collections;

  // Run all the records through the iterator so that they can be normalized.
  eachRecordDeep(options.records, function iterator(record, WLModel) {
    // Check if the record and the model contain any boolean types.
    // Because MySQL returns these as binary (0, 1) they must be
    // transformed into true/false values.
    _.each(WLModel.definition, function checkAttributes(attrDef) {
      var columnName = attrDef.columnName;

      if (attrDef.type === 'boolean' && _.has(record, columnName)) {
        if (!_.isBoolean(record[columnName])) {
          if (record[columnName] === 0) {
            record[columnName] = false;
          }

          if (record[columnName] === 1) {
            record[columnName] = true;
          }
        }
      }

      // JSON parse any type of JSON column type
      if (attrDef.type === 'json' && _.has(record, columnName)) {

        // Special case: If it came back as the `null` literal, leave it alone
        // Special case: Machinepack now uses Mysql2, which return objects if the underlaying column type is "JSON". In
        //               that case we don't need to JSON.parse
        if (_.isNull(record[columnName])) {
          return;
        } else if (_.isObject(record[columnName])) {
          return;
        }

        // But otherwise, assume it's a JSON string and try to parse it
        try {
          record[columnName] = JSON.parse(record[columnName]);
        // eslint-disable-next-line no-unused-vars
        } catch (e) {
          // If it's not valid JSON, leave it alone
          return;
        }
      }

    });
  }, true, options.identity, options.orm);
};
