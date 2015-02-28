// https://github.com/derbyjs/derby-standalone
var app = derby.createApp();
// convenience function for loading templates that are defined as <script type="text/template">
app.registerViews();

var apiAggregations = "http://sensor-api.localdata.com/api/v1/aggregations";
var apiEntries = "http://sensor-api.localdata.com/api/v1/sources/";


var cities = [
  "San Francisco",
  "Bangalore",
  "Boston",
  "Geneva",
  "Rio de Janeiro",
  "Shanghai",
  "Singapore"
]

var resolutions = [
  "5m", "1h", "6h"
]

var ops = [
  "mean",
  "count",
  "max",
  "min",
  "sumsq"
]

var formats = [
  "csv",
  "json"
]

var dates = [
  "last day",
  "last 7 days"
]

var fields = [
  "temperature",
  "light",
  "airquality_raw",
  "sound",
  "humidity",
  "dust"
];

window.app = app
// we register our "tabs" component by associating the Tabs class with the 'tabs' template
app.component('aggregated', Aggregated);
function Aggregated() {}
Aggregated.prototype.init = function(model) {
  model.set("city", "San Francisco")
  model.set("resolution", "1h")
  model.set("format", "csv")
  model.set("op", "mean")
  model.set("selectedDate", "last day")

  model.start("url", "city", "resolution", "selectedDate", "op", "format", function(city, resolution, selectedDate, op, format) {
    var date;
    if(selectedDate === "last day") {
      date = lastDay();
    } else {
      date = last7Days();
    }

    var url = apiAggregations;
    if(format === "csv") url += ".csv";
    url += "?op=" + op +
      "&fields=" + fields.join(",") + 
      "&resolution=" + resolution +
      "&over.city=" + city +
      "&from=" + date.from.toISOString() + 
      "&before=" + date.before.toISOString();
    return url
  });

  model.on("change", "url", handleUrl);
  function handleUrl() {
    model.set("loading", true)
    var url = model.get("url");
    //console.log("url", url)
    var format = model.get("format");
    d3[format](url, function(err, data) {
      if(err) return console.error(err);
      //console.log(data)
      if(format === "csv") {
        model.set("data", d3.csv.format(data))
        model.set("results", data.length)
      } else {
        model.set("data", JSON.stringify(data, null, 2))
        model.set("results", data.data.length)
      }
      model.set("loading", false)
    })
  }
  handleUrl();
}

app.component("individual", Individual)
function Individual() {}
Individual.prototype.init = function(model) {
  model.set("city", "San Francisco")
  model.set("format", "csv")
  model.set("count", "10")

  model.start("sensors", "city", function(city) {
    var sensors =[];
    sources.forEach(function(d) { 
      if(d.city == city) sensors.push(d.name);
    });
    model.set("sensor", sensors[0]);
    return sensors;
  })

  model.start("url", "count", "sensor", "city", "format", function(count, sensor, city, format) {
    var id;
    sources.forEach(function(d) { if(d.name == sensor) return id = d.id; })
    var url = apiEntries + id + "/entries";
    if(format === "csv") url += ".csv";
    url += "?count=" + count + "&sort=desc";
    return url
  });

  model.on("change", "url", handleUrl);
  function handleUrl() {
    model.set("loading", true)
    var url = model.get("url");
    //console.log("url", url)
    var format = model.get("format");
    d3[format](url, function(err, data) {
      if(err) return console.error(err);
      //console.log(data)
      if(format === "csv") {
        model.set("data", d3.csv.format(data))
        model.set("results", data.length)
      } else {
        model.set("data", JSON.stringify(data, null, 2))
        model.set("results", data.data.length)
      }
      model.set("loading", false)
    })
  }
  handleUrl();
}
 

app.component('selectah', Selectah);
function Selectah() {}
Selectah.prototype.init = function(model) {}
Selectah.prototype.edit = function() {
  this.model.set('editing', true);
  var select = this.select;
  setTimeout(function() {
    var evt = document.createEvent('MouseEvents');
    evt.initMouseEvent('mousedown', true, true, window);
    select.dispatchEvent(evt);
  }, 0)
}
Selectah.prototype.selected = function() {
  this.model.set('editing', false)
}

var page = app.createPage();
page.model.set('_page.cities', cities);
page.model.set('_page.resolutions', resolutions);
page.model.set('_page.formats', formats);
page.model.set('_page.dates', dates);
page.model.set('_page.ops', ops);

//this attaches your rendered templates to the body. You could instead append the templates into the div of your choice
document.body.appendChild(page.getFragment('body'));


// calculate dates
function lastDay() {
  var today = new Date();
  var day = today.getUTCDate() - 1;
  var month = today.getUTCMonth();
  if(day < 1) {
    month -= 1;
  }
  var from = new Date(today.getUTCFullYear(), month, day)
  var before = new Date(today.getUTCFullYear(), month, today.getUTCDate());
  return { from: from, before: before }
}
//console.log("from", lastDay().from.toISOString());
//console.log("before", lastDay().before.toISOString());
function last7Days() {
  var today = new Date();
  var day = today.getUTCDate() - 7;
  var month = today.getUTCMonth();
  if(day < 1) {
    month -= 1;
  }
  var from = new Date(today.getUTCFullYear(), month, day)
  var before = today;
  return { from: from, before: before }
}
//console.log("7 from", last7Days().from.toISOString());
//console.log("7 before", last7Days().before.toISOString());