$(document).ready(function() {

    //GLOBAL VARS
    //set up global infowindow array
    var infoWindows = [];

    //set up global sample site marker array
    var BAAMarkersArray = [];
    var HBIMarkersArray = [];
    //watershed layer has to be constructed as a google maps layer to allow for mouseover
    var watershedArray = [];

    // fusion table query for sample sites
    function GetSiteLatLon() {
        //gets coordinates of sample sites from fusion table using ecospark API key

        var query = "SELECT * FROM " + '14ErPIbk46zIPvli3WLXQnz9jFSjkKDn16Yxf_qlh';
        var encodedQuery = encodeURIComponent(query);

        // Construct the URL
        var url = ['https://www.googleapis.com/fusiontables/v1/query'];
        url.push('?sql=' + encodedQuery);
        url.push('&key=AIzaSyBnmhkx6kdlllf6x3PlW7ApNuuv5hosM6E');
        url.push('&callback=?');

        // Send the JSONP request using jQuery
        return $.ajax({
            url : url.join(''),
            dataType : 'jsonp'
        });
    }

    function siteDataSuccessFnc(data, BAAorHBI) {

        var rows = data.rows;
        for (i in rows) {
            var row = rows[i];
            // each row actually a list, but it looks like they all have one element. if not, you have to loop through them instead of this line

            var Watershed = row[0];
            var Subwatershed = row[1];
            var Waterbody = row[2];
            var SiteLocation = row[3];
            var Sitecode = row[4];
            var SiteName = row[5];
            var Latitude = row[6];
            var Longitude = row[7];
            var BAAAverage = row[8];
            var HBIAverage = row[9];
            var SchoolsSampled = row[10];
            var NumTimesSampled = row[11];
            var DataLink = row[12];

            LatLng = new google.maps.LatLng(Latitude, Longitude);

            var image;
            var avgToCheck;
            if (BAAorHBI === "BAA") {
                avgToCheck = BAAAverage;
            } else {
                avgToCheck = HBIAverage;
            }

            //set icon image by index
            if (avgToCheck === "Unimpaired") {
                image = "greencircle";
            } else if (avgToCheck === "Potentially Impaired") {
                image = "orangecircle";
            } else if (avgToCheck === "Impaired") {
                image = "redcircle";
            }

            if (NumTimesSampled >= 2) {
                if (NumTimesSampled === '2') {
                    image = image + "_pale";
                };
                image = image + ".png";
            };

            var html = '<h4>' + Sitecode + '</h4>Watershed: ' + Watershed + '<br/>Subwatershed: ' + Subwatershed + '<br/>Waterbody: ' + Waterbody + '<br/>Site Location: ' + SiteLocation + '<br/>Latitude: ' + Latitude + '<br/>Longitude: ' + Longitude + '<br/>BAA Average: ' + BAAAverage + '<br/>HBI Average: ' + HBIAverage + '<br/><a target="_blank" href=' + DataLink + '>See Collected Data</a>';

            if (NumTimesSampled >= 2 & avgToCheck != 'N/A') {
                var marker = new google.maps.Marker({
                    position : LatLng,
                    map : map,
                    html : html,
                    icon : image
                });

                google.maps.event.addListener(marker, 'click', function() {
                    $("#dvSiteData").html(this.html);
                });
                if (BAAorHBI === "BAA") {
                    BAAMarkersArray.push(marker);
                } else {
                    HBIMarkersArray.push(marker);
                }
            }
        }//end of for loop
        clearOverlays();
        if (BAAorHBI === "HBI") {
            //SAMPLE SITES CHECKED BY DEFAULT
            $("#chkSites").trigger('click');
        }
    }

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

    //HIDE AND SHOW LAYERS
    // Removes the overlays from the map, but keeps them in the array
    function clearOverlays() {
        for (i in BAAMarkersArray) {
            BAAMarkersArray[i].setMap(null);
        }
        for (i in HBIMarkersArray) {
            HBIMarkersArray[i].setMap(null);
        }
    }

    // Shows any overlays currently in the array
    function showOverlays(markersArray) {
        for (i in markersArray) {
            markersArray[i].setMap(map);
        }
    }

    // fusion table query for sample sites
    function GetWaterShedGeom() {
        //gets coordinates of sample sites from fusion table using ecospark API key
        // var query = "SELECT * FROM " + '1XZTtbd_BBRp8LarysLPr6fLJsKOE7X1CUO3e4cpW';
        var query = "SELECT * FROM " + '1mNLTNbTitkhuiYIN8hdi2CBltyv1UAxlVKx6AfHZ';
        var encodedQuery = encodeURIComponent(query);

        // Construct the URL
        var url = ['https://www.googleapis.com/fusiontables/v1/query'];
        url.push('?sql=' + encodedQuery);
        url.push('&key=AIzaSyBnmhkx6kdlllf6x3PlW7ApNuuv5hosM6E');
        url.push('&callback=?');
        // Send the JSONP request using jQuery
        return $.ajax({
            url : url.join(''),
            dataType : 'jsonp'
        });
    }

    function watershedToggle(mapOrNull) {
        $.each(watershedArray, function(index, item) {
            //console.log(item);
            item[0].setMap(mapOrNull);
            google.maps.event.addListener(item[0], 'mouseover', function() {
                this.setOptions({
                    fillColor : "#76a5af",
                });
            });
            google.maps.event.addListener(item[0], "mousemove", function(event) {
                item[1].setPosition(event.latLng);
                item[1].setVisible(true);
            });
            google.maps.event.addListener(item[0], 'mouseout', function() {
                this.setOptions({
                    fillColor : "#45818e",
                });
                item[1].setVisible(false);
            });

        });
    }

    function constructNewCoordinates(polygon) {
        var newCoordinates = [];
        var coordinates = polygon['coordinates'][0];
        for (var i in coordinates) {
            newCoordinates.push(new google.maps.LatLng(coordinates[i][1], coordinates[i][0]));
        }
        return newCoordinates;
    }

    //INITIALIZE PAGE

    //load map when page ready
    google.maps.event.addDomListener(window, 'load', initialize);
    var map;
    function initialize() {
        var mapOptions = {
            center : new google.maps.LatLng(43.982934, -79.030563),
            zoom : 9,
            mapTypeId : google.maps.MapTypeId.ROADMAP
        };
        map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

        google.maps.event.addListener(map, 'idle', mapLoaded());
    }

    function mapLoaded() {

        // Create the search box and link it to the UI element.
        var input = /** @type {HTMLInputElement} */(
            document.getElementById('searchBox'));
        map.controls[google.maps.ControlPosition.TOP_RIGHT].push(input);
        var searchBox = new google.maps.places.SearchBox((input));
        google.maps.event.addListener(searchBox, 'places_changed', function() {
            var places = searchBox.getPlaces();
            map.setCenter(new google.maps.LatLng(places[0].geometry.location.k,places[0].geometry.location.D));
            map.setZoom(15);
        });

        //SET UP SITES LAYER
        var siteData = GetSiteLatLon();
        siteData.success(function(data) {
            siteDataSuccessFnc(data, "BAA");
            siteDataSuccessFnc(data, "HBI");
        });
        //end of siteData.success

        // make layers global
        var greenbelt = addlayers('1VvJTdARHL8ZQT8y2l2g2fwokqCeJCzOqssLR9q4', greenbelt);
        var greenbelt_1 = addlayers('1ZUEgFnExCiqmacbt5Tp7AmeuMxYBRX9g1PtUMj8', greenbelt);
        var greenbelt_2 = addlayers('1BtDthtHzbFOSDzFX9NFWhXea4yCF6HerzTA6BAA', greenbelt);
        var greenbelt_3 = addlayers('11mtGII8LeNJBzLafIwcOOjlrQowW7d4gsGrvwYw', greenbelt);
        var builtup = addlayers('1Y5KvbDhvujVrO7OakTh8VHOLHsnn-Q1BlJgCRi0', builtup);
        var forest = addlayers('1NzB3uRWUhZ_NvbvB3YSoSxs5dKy2wG-QUmT3aUY', forest);
        //var watersheds = addlayers('1XZTtbd_BBRp8LarysLPr6fLJsKOE7X1CUO3e4cpW', watersheds);

        var waterShedData = GetWaterShedGeom();

        waterShedData.success(function(data) {
            $('input[value="watersheds"]').attr('disabled', false);
            var rows = data['rows'];
            for (var i in rows) {
                var newCoordinates = [];
                if (rows[i][21]['geometries'] !== undefined) {
                    var geometries = rows[i][21]['geometries'];
                    $.each(geometries, function(index, value) {
                        newCoordinates.push(constructNewCoordinates(value));
                    });
                } else {
                    var value = rows[i][21]['geometry'];
                    newCoordinates = (constructNewCoordinates(value));
                }
                var randomnumber = Math.floor(Math.random() * 4);
                var polygon = new google.maps.Polygon({
                    paths : newCoordinates,
                    strokeColor : "#134f5c",
                    strokeWeight : 1,
                    fillColor : "#45818e",
                    fillOpacity : 0.5
                });

                var marker = new MarkerWithLabel({
                    position : new google.maps.LatLng(0, 0),
                    draggable : false,
                    raiseOnDrag : false,
                    map : map,
                    labelContent : rows[i][1],
                    labelAnchor : new google.maps.Point(30, 20),
                    labelClass : "labels", // the CSS class for the label
                    labelStyle : {
                        opacity : 1.0
                    },
                    icon : "http://placehold.it/1x1",
                    visible : false
                });

                var watershedItem = [polygon, marker];
                watershedArray.push(watershedItem);
            }
        });

        //HBI/BAA RADIO BUTTON CHANGE
        $("input[name=index]").change(function(evt) {
            clearOverlays();
            if ($('input[name="index"]:checked').val() === "BAA") {
                showOverlays(BAAMarkersArray);
            } else {
                showOverlays(HBIMarkersArray);
            }
        });

        //ON LAYER SELECTION, CHECK IF SITES LAYER IS CHECKED, REFRESH IF SO. SPECIAL SET UP FOR SITES AND WATERSHEDS

        //layer selection checkboxes
        $(':checkbox').on("click", function() {

            var layerString = $(this).val();

            //checks if checkbox of the same name as checkbox is checked
            if ($(this).is(':checked')) {
                if (layerString == "sites") {
                    $('input[name="index"]').attr('disabled', false);
                    if ($('input[name="index"]:checked').val() === "BAA") {
                        showOverlays(BAAMarkersArray);
                    } else {
                        showOverlays(HBIMarkersArray);
                    }
                    $('#dvSiteData').html('<p>Click on an icon to view site data.</p>');
                } else {
                    //if adding a layer and sites is checked, need to refresh sites on top of the layer
                    if ($('#chkSites').is(':checked')) {
                        clearOverlays();
                        if (layerString == "watersheds") {
                            watershedToggle(map);
                        } else {
                            var layer = eval(layerString);
                            layer.setMap(map);
                        }
                        if ($('input[name="index"]:checked').val() === "BAA") {
                            showOverlays(BAAMarkersArray);
                        } else {
                            showOverlays(HBIMarkersArray);
                        }
                    } else {
                        if (layerString == "watersheds") {
                            watershedToggle(map);
                        } else {
                            layer.setMap(map);
                        }
                    }
                }

                //display info text files for layer
                if (layerString.indexOf("greenbelt") > -1) {
                    $("#dvLayerInfo").load("greenbelt.txt");
                } else {
                    $("#dvLayerInfo").load(layerString + ".txt");
                }

                //if checkbox is being unchecked
            } else {
                $("#dvLayerInfo").html('<h4>Check a box to add a layer to the map.</h4>');
                if (layerString == "sites") {
                    $('input[name="index"]').attr('disabled', true);
                    clearOverlays();
                    $('#dvSiteData').html('');
                } else if (layerString == "watersheds") {
                    watershedToggle(null);
                } else {
                    var layer = eval(layerString);
                    layer.setMap(null);
                }
            }
            //end of check box functions
        });

        //end of map loaded function
    }

    //end of doc.ready
});
