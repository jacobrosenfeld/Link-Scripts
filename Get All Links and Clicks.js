// Define the API URL and key - commented out to set in gs pull script
// var API_URL = "API_URL"; // replace with your API URL
// var API_KEY = "API_Key"; // replace with your API Key

// Define the sheet name and headers
var SHEET_NAME = "Links";
var HEADERS = ["ID", "Alias", "Short URL", "Long URL", "Clicks", "Title", "Description", "Date"];

// Create a function to get the links from the API
function getLinks() {
  // Get the active spreadsheet and the sheet with the name
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(SHEET_NAME);
  
  // Clear the sheet content
  sheet.clear();
  
  // Merge cells A1:C1 and set the value to the current date and time
  var now = new Date();
  sheet.getRange("A1:C1").merge().setValue("Data last updated at: " + now.toString()).setHorizontalAlignment("left");
  
  // Set the headers starting from row 2
  sheet.getRange("A2:H2").setValues([HEADERS]);
  
  // Set the authorization header
  var headers = {
    "Authorization": "Bearer " + API_KEY
  };
  
  // Set the request options
  var options = {
    "method": "GET",
    "headers": headers
  };
  
  // Send a request to the API endpoint for getting the links
  var response = UrlFetchApp.fetch(API_URL + "urls?limit=500", options);
  
  // Parse the response as JSON
  var data = JSON.parse(response.getContentText());
  
  // Check if there is any error
  if (data.error == 0) {
    // Loop through the links array
    for (var i = 0; i < data.data.urls.length; i++) {
      // Get the link object
      var link = data.data.urls[i];
      
      // Create an array of values to append to the sheet
      var values = [
        link.id,
        link.alias,
        link.shorturl,
        link.longurl,
        link.clicks,
        link.title,
        link.description,
        link.date
      ];
      
      // Append the values to the sheet starting from row 3
      sheet.appendRow(values);
    }
  } else {
    // Log the error message
    Logger.log(data.message);
  }
}

// This function will run when the spreadsheet is opened
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  // Create a new menu
  ui.createMenu('Link Shortener')
      .addItem('Update Links', 'getLinks')  // Add an item to the menu
      .addToUi();  // Add the menu to the user interface
}
