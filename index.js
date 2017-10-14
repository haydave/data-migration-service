const express = require('express')
const app = express()
const Connection = require('tedious').Connection;
const Request = require('tedious').Request;
const uniqid = require('uniqid');
const formidable = require('formidable');
const extract = require('extract-zip')
const fs = require('fs');
const path = require('path');

app.use(express.static('./'));

const config = {
  userName: 'SA',
  password: '!HimnarK2RDP#',
  server: 'localhost'
}

var connection = new Connection(config);
var isConnected = false;
connection.on('connect', function(err) {
  console.log("asdasdsadsad")
  if (err) {
    console.log(err);
  } else {
    isConnected = true;
  }
});

app.get('/', (req, res) => {
  res.sendFile('index.html');
});

app.post('/upload', (req, res) => {
  var form = new formidable.IncomingForm();
  const dbName = uniqid.time();
  let uploadDir = __dirname + '/uploads/' + dbName + '/';
  form.uploadDir = uploadDir;
  form.maxFieldsSize = 30 * 1024 * 1024;
  fs.mkdir(uploadDir, (err) => {
    if (err) {
        console.log('failed to create directory', err);
    } else {
      form.parse(req, (err, fields, files) => {
        res.write('File uploaded');
        extract(files.fileToUpload.path, {dir: uploadDir}, (err) => {
          if (err) {
            console.log('failed to extract file', err);
          } else {
            let files = fs.readdirSync(uploadDir);
            for (let i in files) {
              if (path.extname(files[i]) === '.bak') {
                var bakFilepath = uploadDir + files[i];
                if (isConnected) {
                  restoreDatabase('Salary', dbName, bakFilepath, uploadDir); // We shoudl be sure that all databases of AS have Salay name
                }
                break;
              }
            }
          }
        });
        res.end();
      });
    }
  });
});

app.listen(3000, () => {
  console.log('Example app listening on port 3000!')
});

////////////////////////////////////////////////
// Utilities                                  //
// TODO: Move into another js file            //
////////////////////////////////////////////////
var runDBStatement = (option, dbName) => {
  let request = new Request(option + ' DATABASE ' + dbName, (err) => {
    if (err) {
      console.log(err);
    }
  });
  connection.execSql(request);
}

var restoreDatabase = (logicalName, dbName, bakFile, uploadDir) => {
  fs.chmodSync(uploadDir, '777'); // hope that this is the temprorary solution, mssql should have write access to uploadDir
  let sql = "RESTORE DATABASE " + dbName + " " +
    "FROM DISK='" + bakFile + "' " +
    "WITH MOVE '" + logicalName + "' TO '" + uploadDir + dbName + ".mdf', " +
    "MOVE '" + logicalName + "_log' TO '" + uploadDir + dbName + ".ldf'";
  let request = new Request(sql, (err, rowCount, rows) => {
    if (err) {
      console.log(err);
    } else {
      console.log(rowCount + ' rows');
    }
  });
  connection.execSql(request);
}
