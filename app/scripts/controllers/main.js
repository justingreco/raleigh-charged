'use strict';
/**
 * @ngdoc function
 * @name chargedApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the chargedApp
 */
angular.module('chargedApp')
  .controller('MainCtrl', ['$scope', '$interval', '$filter', '$document', 'dataFactory', 'leafletData', function ($scope, $interval, $filter, $document, dataFactory, leafletData) {
    angular.extend($scope,{
      center: {
        lat: 35.81889,
        lng: -78.64447,
        zoom: 11
      },
      defaults: {
        minZoom: 10
      },
      tiles: {
        url: 'http://{s}.tile.stamen.com/terrain/{z}/{x}/{y}.png',
        options: {
          attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          subdomains: 'abcd'
        }
      }
    });
    $scope.barOptions =  {
     scaleLabel : "<%= Number(value) + ' kWh'%>",
      responsive: true,
      scaleBeginAtZero : true,
      scaleShowGridLines : false,
      scaleGridLineColor : "rgba(0,0,0,.05)",
      scaleGridLineWidth : 1,
      barShowStroke : true,
      barStrokeWidth : 2,
      barValueSpacing : 5,
      barDatasetSpacing : 1
    };
    $scope.lineOptions =  {
      showXLabels: 2,
      scaleLabel : "<%= Number(value) + ' kWh'%>",
      responsive: true,
      scaleShowGridLines : false,
      scaleGridLineColor : "rgba(0,0,0,.05)",
      scaleGridLineWidth : 1,
      bezierCurve : true,
      bezierCurveTension : 0.4,
      pointDot : true,
      pointDotRadius : 4,
      pointDotStrokeWidth : 1,
      pointHitDetectionRadius : 1,
      datasetStroke : true,
      datasetStrokeWidth : 2,
      datasetFill : true
    };
$scope.rankStart = moment().subtract(1, 'days').toDate();
$scope.rankEnd = new Date();
$scope.focusStart = moment().subtract(1, 'days').toDate();
$scope.focusEnd = new Date();
  $scope.dateOptions = {
    startingDay: 1,
    showWeeks: false
  };
    $scope.dateRange = {range: 'today', minutes: 900000}
    $scope.overallRange = 'today';
    $scope.rankPeriod = 'today';
    $scope.rank = {units: 'kWh', message: 'Ranks the total energy delivered to charged cars over the selected period of time in kilowatt hours (kWh).', type: '0'};
    L.AwesomeMarkers.Icon.prototype.options.prefix = 'ion';
    getStatuses();
    $interval(getStatuses, 100000);
    getOverallStats();
    getRankings();
    $scope.$watch('overallRange', function (newVal, oldVal) {
      if (newVal != oldVal) {
        getOverallStats();
      }
    });
    $scope.$watch('rank', function (newVal, oldVal) {
      if (newVal != oldVal) {
        getRankings();
      }
    });
    $scope.$watch('statsFrom', function (newVal, oldVal) {
      if (newVal != oldVal) {
        getRankings();
      }
    });
    $scope.$watch('rankPeriod', function (newVal, oldVal) {
      if (newVal != oldVal) {
        getRankings();
      }
    });
    $scope.$watch('rankStart', function (newVal, oldVal) {
      if (newVal != oldVal) {
        getRankings();
      }
    });
    $scope.$watch('rankEnd', function (newVal, oldVal) {
      if (newVal != oldVal) {
        getRankings();
      }
    });
    $scope.$watch('focusPeriod', function (newVal, oldVal) {
      if (newVal != oldVal) {
        getStatsForStation($scope.station.ord);
      }
    });
    $scope.$watch('focusStart', function (newVal, oldVal) {
      if (newVal != oldVal) {
        getStatsForStation($scope.station.ord);
      }
    });
    $scope.$watch('focusEnd', function (newVal, oldVal) {
      if (newVal != oldVal) {
        getStatsForStation($scope.station.ord);
      }
    });
    function getRankings () {
      $scope.barOptions.scaleLabel = "<%= ' ' + Number(value) + ' " + $scope.rank.units + "'%>";
      var period = $scope.rankPeriod;
      if ($scope.rankPeriod === 'custom') {
        period = 'timeRange;start=' + $scope.rankStart.toISOString() + ';end=' + $scope.rankEnd.toISOString();
      }
      dataFactory.getPeriscopeData('sustainability.getEvRankXml', '<x rankType="' + $scope.rank.type + '" period="' + period + '"/>').then(function (data) {
        var ranks = [];
        angular.forEach($.xml2json(data).rank.r, function (r) {
          r.$.value = (r.$.value === ".0") ? 0 : parseInt(r.$.value);
          ranks.push({name: r.$.name, value: r.$.value});
        });
        ranks = $filter('orderBy')(ranks, 'value', true);
      $scope.barData = {
            labels: [],
            datasets: [
              {
                label: 'My Second dataset',
                fillColor: 'rgba(151,187,205,0.5)',
                strokeColor: 'rgba(151,187,205,0.8)',
                highlightFill: 'rgba(151,187,205,0.75)',
                highlightStroke: 'rgba(151,187,205,1)',
                data: []
              }
            ]
          };
      angular.forEach(ranks, function (r) {
        $scope.barData.labels.push(r.name);
        $scope.barData.datasets[0].data.push(r.value);
      });
      });
    };
    function getOverallStats () {
      dataFactory.getPeriscopeData('sustainability.getEvOverviewXml', '<str name="val" val=""/>').then(function (data) {
        data= $.xml2json(data);
        $scope.overall = data.xml[$scope.overallRange];
      });
    };
    function getStatuses () {
      dataFactory.getPeriscopeData('sustainability.getEvFocusXml', '<str name="val" val=""/>').then(function (data) {
        showStations($.xml2json(data));
      });
    };
function setMinutes () {
  //console.log(moment($scope.focusEnd).diff(moment($scope.focusStart), 'months'));
  var monthDiff = moment($scope.focusEnd).diff(moment($scope.focusStart), 'months'),
    weekDiff = moment($scope.focusEnd).diff(moment($scope.focusStart), 'weeks');
  if (monthDiff >= 3) {
    return 'M';
  } else if (weekDiff >= 1) {
    return 86400000;
  } else {
    return 900000;
  }
}
    function getStatsForStation (ord, range, minutes) {
      var period = '',
        url = 'history.getRollupRangeXml';
      if ($scope.dateRange.range === 'custom') {
        url = 'history.getRollupTimeRangeXml';
        period += 'startYear="' + $scope.focusStart.getFullYear() + '" ';
        period += 'endYear="' + $scope.focusEnd.getFullYear() + '" ';
        period += 'startMonth="' + $scope.focusStart.getMonth() + '" ';
        period += 'endMonth="' + $scope.focusEnd.getMonth() + '" ';
        period += 'startDay="' + $scope.focusStart.getDate() + '" ';
        period += 'endDay="' + $scope.focusEnd.getDate() + '" ';
        period += 'startHour="' + $scope.focusStart.getHours() + '" ';
        period += 'endHour="' + $scope.focusEnd.getHours() + '" ';
        period += 'startMinute="' + $scope.focusStart.getMinutes() + '" ';
        period += 'endMinute="' + $scope.focusEnd.getMinutes() + '" ';
        range = 'null';
        minutes = setMinutes();
      }
      dataFactory.getPeriscopeData(url, '<xml ' + period + 'range="' + range + '" rollup="sum" minutes="' + minutes + '"><history name="' + ord + '" acc="true"/></xml>')
      .then(function (data) {
      data = $.xml2json(data);
        $scope.lineData = {
          labels: [],
          datasets: [
          {
              label: 'My First dataset',
          fillColor: 'rgba(151,187,205,0.2)',
              strokeColor: 'rgba(151,187,205,1)',
              pointColor: 'rgba(151,187,205,1)',
              pointStrokeColor: '#fff',
              pointHighlightFill: '#fff',
              pointHighlightStroke: 'rgba(151,187,205,1)',
              data: []
          }
        ]};
        angular.forEach(data.range.history.record, function (r) {
          var ts = r.ts.split(',');
          //if (ts[4] === '0') {
          switch ($scope.dateRange.range) {
            case 'today':
              $scope.lineData.labels.push(ts[3] + ":" + ((ts[4] === '0') ? '00' : ts[4] ));
            break;
            case 'weekToDate':
              $scope.lineData.labels.push(ts[3] + ":" + ((ts[4] === '0') ? '00' : ts[4] ));
            break;
            case 'monthToDate':
              $scope.lineData.labels.push(parseInt(ts[1]) + 1 + '/' +ts[2]);
            break;
            case 'yearToDate':
              $scope.lineData.labels.push(parseInt(ts[1]) + 1 + '/' + '1' + '/' + parseInt(ts[0]));
            break;
            case 'custom':
              setCustomLabels ([data.range.$.startYear, data.range.$.startMonth, data.range.$.startDay], [data.range.$.endYear, data.range.$.endMonth, data.range.$.endDay], r);
          }
          $scope.lineData.datasets[0].data.push(r.sum);
        });
      });
    };
    function setCustomLabels (start, end, current) {
      //console.log(moment($scope.focusEnd).diff(moment($scope.focusStart), 'months'));
      var ts = current.ts.split(','),
        monthDiff = moment(end).diff(moment(start), 'months'),
        weekDiff = moment(end).diff(moment(start), 'weeks');
      if (monthDiff >= 3) {
        return $scope.lineData.labels.push(parseInt(ts[1]) + 1 + '/' + '1' + '/' + parseInt(ts[0]));
      } else if (weekDiff >= 1) {
        return $scope.lineData.labels.push(parseInt(ts[1]) + 1 + '/' +ts[2]);;
      } else {
        return $scope.lineData.labels.push(ts[3] + ":" + ((ts[4] === '0') ? '00' : ts[4] ));
      }
    }
    function showStations (status) {
      $scope.stations = [];
      status.map.s.forEach(function (s) {
        $scope.stations.push(s.$);
      });
      dataFactory.getLocations().then(function (geojson) {
        $scope.geojson = {
          data: geojson,
          onEachFeature: function (feature, layer) {
            var s = status.map.s.filter(function (s, i) {
              return s.$.name === feature.properties.NAME;
            }),
              iconOptions = {};
            if (s.length > 0) {
              switch(s[0].$.status) {
              case 'available':
                iconOptions = {iconColor: 'white', markerColor: 'gray', icon: 'checkmark'};
              break;
              case 'connected':
                iconOptions = {iconColor: 'white', markerColor: 'green', icon: 'plus'};
              break;
              case 'charging':
                iconOptions = {iconColor: 'black', markerColor: 'orange', icon: 'flash'};
              break;
              case 'future location':
                iconOptions = {iconColor: 'white', markerColor: 'blue', icon: 'coffee'};
              break;
              case 'out of service':
                iconOptions = {iconColor: 'white', markerColor: 'red', icon: 'coffee'};
              break;
              }
              layer.setIcon(L.AwesomeMarkers.icon(iconOptions));
              layer.on('click', function () {
                $scope.stations.forEach(function (s, i) {
                  if (s.name === feature.properties.NAME) {
                    $scope.station = s;
                    $scope.stationSelected(s);
                  }
                });
              });
            }
          }
        };
       
      });
    };

    $scope.stationSelected = function (station) {
      $scope.station = station;
      getStatsForStation(station.ord, $scope.dateRange.range, $scope.dateRange.minutes );
      leafletData.getMap().then(function(map) {
        var feature = $scope.geojson.data.features.filter(function (f) {
          return f.properties.NAME === station.name;
        })
        if (feature.length > 0) {
          map.setView([feature[0].geometry.coordinates[1],feature[0].geometry.coordinates[0]], 18);
        }
      });
    };
    $scope.$watch('dateRange', function () {
      if ($scope.station) {
      getStatsForStation($scope.station.ord, $scope.dateRange.range, $scope.dateRange.minutes );
      }
    });
    $scope.goTo = function (id) {
      $document.scrollTo(angular.element(document.getElementById(id)), 60, 1000);
    };
  }]);
