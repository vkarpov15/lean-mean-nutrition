var moment = require('moment');
var _ = require('underscore');

exports.WeeklyController = function($scope, $http) {
  $scope.data = {};

  $scope.load = function() {
    $http.get('/api/weekly').
      success(function(data) {
        $scope.data = data;

        _.each($scope.data.weeks, function(w, i) {
          var year = $scope.data.yearForWeek[i];
          var m = moment.utc();
          // MongoDB uses 0-based weeks for some reason, hence w + 1
          m.year(year).isoWeek(w + 1).weekday(0);
          $scope.data.weeks[i] = m.format("MM/DD/YYYY") + " - " +
            m.weekday(6).format("MM/DD/YYYY");
        });
      }).
      error(function(data) {
        if (data.redirect) {
          $window.location.href = data.redirect;
        }
      });
  };

  $scope.load();
};