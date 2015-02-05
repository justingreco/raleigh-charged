'use strict';

/**
 * @ngdoc function
 * @name chargedApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the chargedApp
 */
angular.module('chargedApp')
  .controller('AboutCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  });
