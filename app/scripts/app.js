'use strict';

/**
 * @ngdoc overview
 * @name chargedApp
 * @description
 * # chargedApp
 *
 * Main module of the application.
 */
angular
  .module('chargedApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'leaflet-directive',
    'tc.chartjs',
    'ui.bootstrap',
    'angular-loading-bar',
    'duScroll','ui.bootstrap.datetimepicker'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  })
  .factory('dataFactory', function($http, $q) {
    var service = {},
      baseUrl = 'http://periscope.raleighnc.gov/periscopeApi/';
      
      service.getPeriscopeData = function (xml, values) {
        var deferred = $q.defer();
          $http({
            url: 'scripts/xmlproxy.php',
            params: {
              url: baseUrl + xml,
              values: values
            }
          }).success(function (data) {
            deferred.resolve(data);
          });   
        return deferred.promise;
      };

      service.getLocations = function () {
        var deferred = $q.defer();
        $http({
          url: 'data/ev.json'
        }).success(function (geojson) {
          deferred.resolve(geojson);
        });
        return deferred.promise;
      };
    return service;
  });
