'use strict';

/**
 * @ngdoc function
 * @name chargedApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the chargedApp
 */
angular.module('chargedApp')
  .controller('MainCtrl', function ($scope, $interval, $filter, $document, dataFactory) {
    $scope.tiles = {
	    url: "http://{s}.tile.stamen.com/terrain/{z}/{x}/{y}.png",
	    options: {
		    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
		    subdomains: 'abcd'
		}
    };
    $scope.center = {
    	lat: 35.81889,
    	lng: -78.64447,
    	zoom: 11
    };
    $scope.barOptions =  {
	  scaleLabel : "<%= Number(value) + ' kWh'%>",
      responsive: true,
      scaleBeginAtZero : true,
      scaleShowGridLines : true,
      scaleGridLineColor : "rgba(0,0,0,.05)",
      scaleGridLineWidth : 1,
      barShowStroke : true,
      barStrokeWidth : 2,
      barValueSpacing : 5,
      barDatasetSpacing : 1
    };

    $scope.lineOptions =  {
      showXLabels: 10,
      scaleLabel : "<%= Number(value) + ' kWh'%>",
	  responsive: true,
      scaleShowGridLines : true,
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

   	$scope.$watch('rankPeriod', function (newVal, oldVal) {
   		if (newVal != oldVal) {
   			getRankings();
   		}
   	});

   	function getRankings () {
   		$scope.barOptions.scaleLabel = "<%= Number(value) + ' " + $scope.rank.units + "'%>";
	    dataFactory.getPeriscopeData('sustainability.getEvRankXml', '<x rankType="' + $scope.rank.type + '" period="' + $scope.rankPeriod + '"/>').then(function (data) {
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

   	function getStatsForStation (ord, range, minutes) {
	    dataFactory.getPeriscopeData('history.getRollupRangeXml', '<xml range="' + range + '" rollup="sum" minutes="' + minutes + '"><history name="' + ord + '" acc="true"/></xml>')
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
	    				$scope.lineData.labels.push(parseInt(ts[1]) + 1 + '/' + '1');
	    			break;
	    		}
	    		$scope.lineData.datasets[0].data.push(r.sum);
	    	});
	    });
   	};


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
								iconOptions = {iconColor: 'white', markerColor: 'orange', icon: 'flash'};									
							break;
							case 'future location':
								iconOptions = {iconColor: 'white', markerColor: 'blue', icon: 'coffee'};									
							break;
							case 'out of service':
								iconOptions = {iconColor: 'white', markerColor: 'red', icon: 'coffee'};								
							break;    						
    					}
    					layer.setIcon(L.AwesomeMarkers.icon(iconOptions));
    				}

    			}
    		}
    	});
    };

    $scope.stationSelected = function (station) {
    	$scope.station = station;
    	getStatsForStation(station.ord, $scope.dateRange.range, $scope.dateRange.minutes );
    };

    $scope.$watch('dateRange', function () {
    	if ($scope.station) {
 			getStatsForStation($scope.station.ord, $scope.dateRange.range, $scope.dateRange.minutes );
    	}
    });

    $scope.goTo = function (id) {
      $document.scrollTo(angular.element(document.getElementById(id)), 60, 1000);
    };

  });
