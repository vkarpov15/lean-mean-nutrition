exports.calorieAggregatorEndpoint = function(weeklyCalorieAggregator) {
  return function(req, res) {
    weeklyCalorieAggregator.runAggregation(function(error, result) {
      res.send("Done");
    });
  }
};