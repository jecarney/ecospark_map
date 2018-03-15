$(document).ready(function() {

	//INITITALIZE PAGE

	//load map when page ready
	google.maps.event.addDomListener(window, 'load', initialize);
	var map;
	function initialize() {
		var mapOptions = {
			center : new google.maps.LatLng(43.982934,-79.030563),
			zoom : 9,
			mapTypeId : google.maps.MapTypeId.ROADMAP,
			disableDefaultUI: true,
			disableDoubleClickZoom: true,
    		draggable: false,
   		    scrollwheel: false,
    		panControl: false
		};

		map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
		//SAMPLE SITES CHECKED BY DEFAULT
		$("#chkSites").trigger('click');

	}

	//SET UP SITES LAYER

	// fusion table query for sample sites
	function GetSiteLatLon() {
		//gets coordinates of sample sites from fusion table using ecospark API key
		var url = 'https://www.googleapis.com/fusiontables/v1/query?sql=SELECT%20*%20FROM%201MwenfK4wOxpVYHkyGrpm3WsxNuGKY2neyyg6Dp0&key=AIzaSyBnmhkx6kdlllf6x3PlW7ApNuuv5hosM6E';
		return $.ajax({
			url : url,
			dataType : 'jsonp'
		});
	}

	// Removes the overlays from the map, but keeps them in the array
	function clearOverlays() {
		for (i in markersArray) {
			markersArray[i].setMap(null);
		}
	}

	// Shows any overlays currently in the array
	function showOverlays() {
		for (i in markersArray) {
			markersArray[i].setMap(map);
		}
	}

	//set up global infowindow array
	var infoWindows = [];

	//set up global sample site marker array
	var markersArray = [];
	var siteData = GetSiteLatLon();
	siteData.success(function(data) {
		// alert('sitedata success')
		var rows = data.rows;

		for (i in rows) {
			var row = rows[i];
			// each row actually a list, but it looks like they all have one element. if not, you have to loop through them instead of this line

			var siteName = row[0];
			var infoWindowContent = row[1];
			var siteIndex = row[2];
			var siteGeometry = row[3];

			//set up site markers
			var coordinates = siteGeometry.geometry.coordinates;

			//the fusion tables contains a z coordinate, need to trim it out, then reformat to float
			var str = coordinates.toString();
			var latString = str.substring(11, 20);
			var lngString = str.substring(0, 10);

			var lat = parseFloat(latString);
			var lng = parseFloat(lngString);

			LatLng = new google.maps.LatLng(lat, lng);

			//don't display sites with 0 index
			if (siteIndex > 0) {

				//set icon image by index
				if (siteIndex < 6) {
					var image = "greendrop.png";
				} else if (siteIndex >= 6 && siteIndex <= 7) {
					var image = "orangedrop.png";
				} else {
					var image = "reddrop.png";
				}

				var marker = new google.maps.Marker({
					position : LatLng,
					map : map,
					title : siteName,
					html : infoWindowContent,
					siteIndex : siteIndex,
					icon : image
				});

				google.maps.event.addListener(marker, 'click', function() {
					//alert(this.title + this. html + this.siteIndex);

					$("#dvSiteData").html('<h4>' + this.title + '<h4/>' + '<p> Index = ' + this.siteIndex + '</p>' + this.html);
				});

				// infoWindows.push(infoWindowContent);
				markersArray.push(marker);
			}
			//end of for loop
		}
		clearOverlays();
		//end of siteData.success
	});

	//TO SET UP WATERSHEDS LAYER WITH LABELS
	var watershedLabelsArray = [];
	//var waterShedLabelContent = [["Watershed Label", 44.047795, -79.060844], ["Watershed Label 2", 44.194841, -79.865112]];

	var watershedLabelContent = {
		"Humber - Don Rivers" : {
			"lat" : "43.912156",
			"lng" : "-79.433898"
		},
		"Ganaraska" : {
			"lat" : "44.005492",
			"lng" : "-78.65112"
		},
		"Crowe" : {
			"lat" : "44.194841",
			"lng" : "-77.876586"
		},
		"Otonabee" : {
			"lat" : "44.289288",
			"lng" : "-78.277587"
		},
		"Kawartha Lakes" : {
			"lat" : "44.394542",
			"lng" : "-78.512627"
		},
		"Scugog" : {
			"lat" : "44.273557",
			"lng" : "-78.848876"
		},
		"Black River - Lake Simcoe" : {
			"lat" : "44.306161",
			"lng" : "-79.324448"
		},
		"Nottawasaga" : {
			"lat" : "44.242083",
			"lng" : "-79.97497"
		},
		"Upper Grand" : {
			"lat" : "43.700478",
			"lng" : "-80.293579"
		},
		"Credit River - 16 Mile Creek" : {
			"lat" : "43.6686994",
			"lng" : "-79.931030"
		}
	};
	$.each(watershedLabelContent, function(key, value) {
		makeWatershedLabels(key, value);
		//alert(value.lat+ value.lng );
	});

	function makeWatershedLabels(labelname, coordinates) {
		var labelText = labelname;

		var myOptions = {
			content : labelText,
			boxStyle : {
				border : "0px solid black",
				textAlign : "center",
				fontSize : "10pt",
				width : "50px",
				color : "#FFFFFF"
			},
			disableAutoPan : true,
			pixelOffset : new google.maps.Size(-25, 0),
			position : new google.maps.LatLng(coordinates.lat, coordinates.lng),
			closeBoxURL : "",
			isHidden : false,
			pane : "floatPane",
			enableEventPropagation : true
		};

		var ibLabel = new InfoBox(myOptions);
		watershedLabelsArray.push(ibLabel);
	}

	// to show or hide watershed labels
	function watershedLabels(openOrClosed) {

		for (i in watershedLabelsArray) {
			var label = watershedLabelsArray[i];
			if (openOrClosed == "open") {
				label.open(map);
				label.setVisible(true);
			} else {
				label.setVisible(false);
			}
		}
	}

	//TO SET UP ALL OTHER LAYERS

	//to create layers
	function addlayers(table, layer) {

		layer = new google.maps.FusionTablesLayer(table, {

			query : {
				select : 'geography',
				from : table
			},
			styleId : 2,
			templateId : 2,
			options : {
				suppressInfoWindows : true
			}
		});

		return layer;

	}

	// make layers global
	var greenbelt = addlayers('1VvJTdARHL8ZQT8y2l2g2fwokqCeJCzOqssLR9q4', greenbelt);
	var greenbelt_1 = addlayers('1ZUEgFnExCiqmacbt5Tp7AmeuMxYBRX9g1PtUMj8', greenbelt);
	var greenbelt_2 = addlayers('1BtDthtHzbFOSDzFX9NFWhXea4yCF6HerzTA6BAA', greenbelt);
	var greenbelt_3 = addlayers('11mtGII8LeNJBzLafIwcOOjlrQowW7d4gsGrvwYw', greenbelt);
	var builtup = addlayers('1Y5KvbDhvujVrO7OakTh8VHOLHsnn-Q1BlJgCRi0', builtup);
	var forest = addlayers('13meME0ZdNumO9_v7NXVo4H4eGPP4-jdwrAaP4hI', forest);
	var watersheds = addlayers('1ttnhJNINjW0q97jOJfpd-bezxRzcSZggmVrY7gc', watersheds);

	//ON LAYER SELECTION, CHECK IF SITES LAYER IS CHECKED, REFRESH IF SO. SPECIAL SET UP FOR SITES AND WATERSHEDS

	//layer selection checkboxes
	$(':checkbox').on("click", function() {

		var layerString = $(this).val();

		// alert(layerString);

		//checks if checkbox of the same name as checkbox is checked
		if ($(this).is(':checked')) {

			if (layerString == "sites") {

				showOverlays();
				$('#dvSiteData').html('Click on an icon to view site data.');

			} else {

				var layer = eval(layerString);
				//if adding a layer and sites is checked, need to refresh sites on top of the layer
				if ($('#chkSites').is(':checked')) {
					clearOverlays();
					layer.setMap(map);
					showOverlays();

					if (layerString == "watersheds") {
						var openOrClosed = "open"
						watershedLabels(openOrClosed);
					}

				} else {
					layer.setMap(map);
					if (layerString == "watersheds") {
						var openOrClosed = "open"
						watershedLabels(openOrClosed);
					}
				}
			}

			//display info text files for layer
			$("#dvLayerInfo").load(layerString + ".txt");

			//if checkbox is being unchecked
		} else {
			$("#dvLayerInfo").html('<h4>Check a box to add a layer to the map.</h4>');
			if (layerString == "sites") {
				clearOverlays();
				$('#dvSiteData').html('');
			} else {
				var layer = eval(layerString);
				layer.setMap(null);
				if (layerString == "watersheds") {
					var openOrClosed = "close"
					watershedLabels(openOrClosed);
				}

			}

		}
		//end of check box functions
	});

	//end of doc.ready
});
