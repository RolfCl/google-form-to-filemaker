// Kör funktionen initialize() minst en gång för att lägga till trigger
function initialize() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i in triggers) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
  ScriptApp.newTrigger("submitFormToFileMaker")
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onFormSubmit()
    .create();
}

function submitFormToFileMaker(e) {

  // FileMaker-databas
  var fmConnection = {
    "database": "https://SERVERADRESS/fmi/data/v1/databases/DATABASNAMN",
    "layout": "LAYOUTNAMN",
    "account": "KONTONAMN",
    "password": "LÖSENORD"
  };

  // Översättning till fältnamnen i FileMaker-databasen
  var fmFields = {
    // "Google Form Name": "FileMaker Field Name"
    "Namn": "Namn",
    "E-postadress": "Epost",
    "Tidstämpel": "Google tid"
  };

  // Hämta formulärdata, logga in, skicka uppgifter och logga ut
  var googleFormData = getGoogleFormData (e);
  var fmFormData = prepareGoogleFormData (googleFormData,fmFields);  
  var fmDataToken = login (fmConnection);
  createRecord (fmConnection,fmFormData,fmDataToken);
  logout(fmConnection,fmDataToken);
  
  // Functions
  function login (fmConnection) {

      var url = fmConnection.database + "/sessions";
      var headers =
          {
            "Authorization" : "Basic " + Utilities.base64Encode (fmConnection.account + ":" + fmConnection.password),
            "Content-Type": "application/json",
          };
      var data = {};
      var payload = JSON.stringify(data);
      var options =
          {
            "method": "POST",
            "headers": headers,
            "payload": payload
          };
      var response = UrlFetchApp.fetch (url,options);
      var dataAll = JSON.parse (response.getContentText());
      fmDataToken = dataAll.response.token;
      return fmDataToken;
  }

  function createRecord (fmConnection,recordData,fmDataToken) {
      var url = fmConnection.database + "/layouts/" + fmConnection.layout + "/records";
      var headers =
          {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + fmDataToken
          };
      var data = 
          { 
            "fieldData": recordData
          };
      var payload = JSON.stringify (data);
      var options =
          {
            "method": "POST",
            "headers": headers,
            "payload": payload
          }
      var response = UrlFetchApp.fetch (url,options);
      return response;
  }

  function logout (fmConnection,fmDataToken) {
     var url = fmConnection.database + "/sessions/" + fmDataToken;
     var headers =
         {
            "Content-Type": "application/json"
         };
     var options =
         {
            "method": "DELETE",
            "headers": headers,
          };
     var response = UrlFetchApp.fetch (url,options);
     return response;
  }

  function getGoogleFormData (e) {
     if (typeof e === "undefined" || !e) {
        // debug, sätt in dummy-värden
        e = {namedValues: {"E-postadress": ["epost@epost.se"], "Namn" : ["Rolf"]}};
     }
     return e;
  }

  function prepareGoogleFormData (e,fmFields) {
     var fieldData = {};
     for (var k in e.namedValues) {
       if (fmFields[k] != undefined) {
         fieldData[fmFields[k]] = e.namedValues[k][0];
       }
     }
     return fieldData;
  }
}