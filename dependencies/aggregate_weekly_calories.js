var moment = require('moment');

exports.factory = function(mongodb, cron) {
  var ret = {};

  ret.outputCollection = 'weekly_calories';

  ret.get = function(user, callback) {
    mongodb.connection().collection(ret.outputCollection).findOne({ _id : user },
        function(error, doc) {
      callback(error, doc);
    });
  };

  ret.runAggregation = function(callback) {
    mongodb.connection().collection('days').aggregate([
      // Pull out week of the year and day of the week from the date
      {
        $project : {
          week : { $week : "$date" },
          dayOfWeek : { $dayOfWeek : "$date" },
          user : "$user",
          foods : "$foods"
        }
      },
      // Generate a document for each food item
      {
        $unwind : "$foods"
      },
      // And for each nutrient
      {
        $unwind : "$foods.nutrients"
      },
      // Only care about calories
      {
        $match : {
          'foods.nutrients.tagname' : 'ENERC_KCAL'
        }
      },
      // Add up calories for each week, keeping track of how many days in that
      // week the user recorded eating something. Output one document per
      // user and week.
      {
        $group : {
          _id : {
            week : "$week",
            user : "$user"
          },
          days : { $addToSet : '$dayOfWeek' },
          calories : {
            $sum : {
              $multiply : [
                '$foods.nutrients.amountPer100G',
                { $divide : ['$foods.selectedWeight.grams', 100] }
              ]
            }
          }
        }
      },
      // Aggregate all the documents on a per-user basis.
      {
        $group : {
          _id : "$_id.user",
          weeks : { $push : "$_id.week" },
          daysPerWeek : { $push : "$days" },
          caloriesPerWeek : { $push : "$calories" }
        }
      },
      // Output to the 'weekly_calories' collection
      {
        // Hardcode string here so can copy/paste this aggregation into shell
        // for instructional purposes.
        $out : 'weekly_calories'
      }
    ], callback);
  };

  var job = new cron.CronJob('00 00 30 * * 0-6', function() {
    ret.runAggregation(function() {});
  });

  job.start();

  return ret;
};