'use strict';

/**
 * @ngdoc function
 * @name chargedApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the chargedApp
 */
angular.module('chargedApp')
  .controller('MainCtrl', function ($scope, $interval, $filter, dataFactory) {
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
      // Sets the chart to be responsive
      responsive: true,

      //Boolean - Whether the scale should start at zero, or an order of magnitude down from the lowest value
      scaleBeginAtZero : true,

      //Boolean - Whether grid lines are shown across the chart
      scaleShowGridLines : true,

      //String - Colour of the grid lines
      scaleGridLineColor : "rgba(0,0,0,.05)",

      //Number - Width of the grid lines
      scaleGridLineWidth : 1,

      //Boolean - If there is a stroke on each bar
      barShowStroke : true,

      //Number - Pixel width of the bar stroke
      barStrokeWidth : 2,

      //Number - Spacing between each of the X value sets
      barValueSpacing : 5,

      //Number - Spacing between data sets within X values
      barDatasetSpacing : 1,

      //String - A legend template
      legendTemplate : '<ul class="tc-chart-js-legend"><% for (var i=0; i<datasets.length; i++){%><li><span style="background-color:<%=datasets[i].fillColor%>"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>'
    };

    $scope.lineOptions =  {
      scaleLabel : "<%= Number(value) + ' kWh'%>",
	  showXLabels: 10,
      // Sets the chart to be responsive
      responsive: true,

      ///Boolean - Whether grid lines are shown across the chart
      scaleShowGridLines : true,

      //String - Colour of the grid lines
      scaleGridLineColor : "rgba(0,0,0,.05)",

      //Number - Width of the grid lines
      scaleGridLineWidth : 1,

      //Boolean - Whether the line is curved between points
      bezierCurve : true,

      //Number - Tension of the bezier curve between points
      bezierCurveTension : 0.4,

      //Boolean - Whether to show a dot for each point
      pointDot : true,

      //Number - Radius of each point dot in pixels
      pointDotRadius : 4,

      //Number - Pixel width of point dot stroke
      pointDotStrokeWidth : 1,

      //Number - amount extra to add to the radius to cater for hit detection outside the drawn point
      pointHitDetectionRadius : 1,

      //Boolean - Whether to show a stroke for datasets
      datasetStroke : true,

      //Number - Pixel width of dataset stroke
      datasetStrokeWidth : 2,

      //Boolean - Whether to fill the dataset with a colour
      datasetFill : true,

      // Function - on animation progress
      onAnimationProgress: function(){},

      // Function - on animation complete
      onAnimationComplete: function(){},

      //String - A legend template
      legendTemplate : '<ul class="tc-chart-js-legend"><% for (var i=0; i<datasets.length; i++){%><li><span style="background-color:<%=datasets[i].strokeColor%>"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>'
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

   	$scope.$watch('overallRange', getOverallStats);

   	$scope.$watch('rank', getRankings);
   	$scope.$watch('rankPeriod', getRankings);

   	function getRankings () {
   		$scope.barOptions.scaleLabel = "<%= Number(value) + ' " + $scope.rank.units + "'%>";
	    dataFactory.getPeriscopeData('sustainability.getEvRankXml', '<x rankType="' + $scope.rank.type + '" period="' + $scope.rankPeriod + '"/>').then(function (data) {
	    	var ranks = [];
	    	angular.forEach($.xml2json(data).rank.r, function (r) {
	    		r.$.value = (r.$.value === ".0") ? 0 : parseInt(r.$.value);
	    		ranks.push({name: r.$.name, value: r.$.value});
	    	});
	    	ranks = $filter('orderBy')(ranks, 'value', true);
	    	console.log(ranks);
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
	    		//} else {
	    		//	$scope.data.labels.push('');
	    		//}
	    		
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
  });
