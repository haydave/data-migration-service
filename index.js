const express = require('express')
const app = express()
const Connection = require('tedious').Connection;
const Request = require('tedious').Request;
const shortid = require('shortid');
const formidable = require('formidable');

app.use(express.static('./'));

var config = {
  userName: 'SA',
  password: '!HimnarK2RDP#',
  server: 'localhost'
}

var connection = new Connection(config);
connection.on('connect', function(err) {
  if (err) {
    console.log(err);
  }
});

app.get('/', (req, res) => {
  res.sendFile('index.html');
});

app.post('/upload', (req, res) => {
  var form = new formidable.IncomingForm();
  form.uploadDir = "./uploads";
  form.maxFieldsSize = 30 * 1024 * 1024;
  form.parse(req, (err, fields, files) => {
    res.write('File uploaded');
    var dbName = shortid.generate();
    runDBStatement("CREATE", dbName);
    runDBStatement("DELETE", dbName);
    res.end();
  });
});

app.listen(3000, () => {
  console.log('Example app listening on port 3000!')
});

////////////////////////////////////////////////
// Utilities                                  //
// TODO: Move into another js file            //
////////////////////////////////////////////////
let runDBStatement = (option, dbName) => {
  var request = new Request(option + " DATABASE " + dbName, function(err, rowCount) {
    if (err) {
      console.log(err);
    } else {
      console.log(rowCount + ' rows');
    }
    connection.close();
  });
  connection.execSql(request);
}
