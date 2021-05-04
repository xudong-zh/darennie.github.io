mapboxgl.accessToken =
  "pk.eyJ1IjoiZGFyZW5uaWUiLCJhIjoiY2tqdmV5Y2UzMDhkZDJvbXIyZmowOTBqaCJ9.k1H7Vh1xjqoentYLLuJqwA";

var map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/darennie/cklusdq8s3pw317ptqes1zbo2",
  center: [-113.499, 53.5405], // starting position
  zoom: 11,
});

map.addControl(new mapboxgl.NavigationControl());

map.dragRotate.disable();

map.touchZoomRotate.disableRotation();

let todaysDate = new Date();
let today = Date.parse(todaysDate);

map.on("load", function () {
  d3.json(
    "https://data.edmonton.ca/resource/k4tx-5k8p.json",
    function (TrafficInformation) {
      console.log(TrafficInformation);

      var myGeojson = {};
      myGeojson.type = "FeatureCollection";
      myGeojson.features = [];

      var i;
      for (i = 0; i < TrafficInformation.length; i++) {
        let closureReason = TrafficInformation[i].closure;
        let disruptionID = TrafficInformation[i].disruption_id;
        let givenDescription = TrafficInformation[i].description;
        let expandedDetails = TrafficInformation[i].details;
        let expectedResult = TrafficInformation[i].impact;
        let affectedRoad = TrafficInformation[i].on_street;
        let beginningStreet = TrafficInformation[i].from_street;
        let finishingStreet = TrafficInformation[i].to_street;
        let activityType = TrafficInformation[i].activity_type;
        let startDate = TrafficInformation[i].start_date;
        let finishDate = TrafficInformation[i].finish_date;
        let status = TrafficInformation[i].status;
        let unixFinishDate = Date.parse(finishDate);
        let unixStartDate = Date.parse(startDate);
        let startToFinish = unixFinishDate - unixStartDate;
        let timeDifference = unixFinishDate - today;
        let oneDay = 1000 * 60 * 60 * 24;
        let daysDifferent = Math.floor(timeDifference / oneDay);
        let constructionLengthDays = Math.floor(startToFinish / oneDay);
        let theDate = new Date(unixFinishDate);
        let dateString = theDate.toUTCString();
        let dateFormatted = dateString.substr(0, 16);
        let newFeature = {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [
              TrafficInformation[i].point.coordinates[0],
              TrafficInformation[i].point.coordinates[1],
            ],
          },
          properties: {
            closureReason: closureReason,
            daysDifferent: daysDifferent,
            givenDescription: givenDescription,
            expandedDetails: expandedDetails,
            expectedResult: expectedResult,
            affectedRoad: affectedRoad,
            status: status,
            activityType: activityType,
            constructionLengthDays: constructionLengthDays,
            dateFormatted: dateFormatted,
            beginningStreet: beginningStreet,
            finishingStreet: finishingStreet,
            disruptionID: disruptionID,
          },
        };
        myGeojson.features.push(newFeature);
      }

      map.addSource("points", {
        type: "geojson",
        data: myGeojson,
      });

      map.addLayer({
        id: "TrafficIncidents",
        type: "circle",
        source: "points",
        layout: {
          visibility: "visible",
        },
        paint: {
          "circle-color": {
            property: "daysDifferent",
            stops: [
              [0, "#ff0000"],
              [7, "#ffff66"],
              [14, "#33cc33"],
            ],
          },
          "circle-stroke-width": 0.1,
          "circle-stroke-color": "#999",
          "circle-stroke-opacity": 1,
        },
      });

      // Create a pop up, but don't add to map yet
      var popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
      });

      map.on("mouseenter", "TrafficIncidents", function (e) {
        // Change on the cursor style as a UI indicator
        map.getCanvas().style.cursor = "pointer";

        var coordinates = e.features[0].geometry.coordinates.slice();
        var description =
          "<h2>" +
          e.features[0].properties.closureReason +
          " - " +
          e.features[0].properties.expectedResult +
          "</h2>" +
          "<p><b>Disruption ID: </b>" +
          e.features[0].properties.disruptionID +
          "</p><p><b>Disruption Reason:</b> " +
          e.features[0].properties.givenDescription +
          "</p><p><b>Location Details: </b>" +
          e.features[0].properties.affectedRoad +
          " will be affected from " +
          e.features[0].properties.beginningStreet +
          " to " +
          e.features[0].properties.finishingStreet +
          "</p><p><p><b>Days until Scheduled Completion:</b> " +
          e.features[0].properties.daysDifferent +
          " day(s)" +
          "</p><p><b>Scheduled Completion Date:</b> " +
          e.features[0].properties.dateFormatted +
          "</p><p><b>Scheduled Disruption Length:</b> " +
          e.features[0].properties.constructionLengthDays +
          " day(s)</p>" +
          "<p></p> <b>More Information:</b> " +
          e.features[0].properties.expandedDetails;

        popup
          .setLngLat(coordinates)
          .setHTML(description)
          .addTo(map)
          .setMaxWidth("50%");
      });

      map.on("mouseleave", "TrafficIncidents", function () {
        map.getCanvas().style.cursor = "";
        popup.remove();
      });
    }
  );
});