const express = require('express')
const app = express()
const Connection = require('tedious').Connection;
const Request = require('tedious').Request;
const shortid = require('shortid');
const formidable = require('formidable');
const extract = require('extract-zip')
const fs = require('fs');
const path = require('path');

app.use(express.static('./'));

var config = {
  userName: 'SA',
  password: '!HimnarK2RDP#',
  server: 'localhost'
}

var connection = new Connection(config);

app.get('/', (req, res) => {
  res.sendFile('index.html');
});

app.post('/upload', (req, res) => {
  var form = new formidable.IncomingForm();
  var dbName = shortid.generate();
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
                 let backupDBName = files[i].split(' ')[0]; // assume that extracted archive contains correct db name
                 console.log(backupDBName, dbName, uploadDir + files[i], uploadDir);
                 connection.on('connect', function(err) {
                   if (err) {
                     console.log(err);
                   } else {
                     //runDBssssStatement(backupDBName, dbName, uploadDir + files[i], uploadDir);
                     runDBStatement("CREATE", dbName);
                     //runDBStatement("DELETE", dbName);
                   }
                 });
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
let runDBStatement = (option, dbName) => {
  var request = new Request(option + ' DATABASE ' + dbName, (err) => {
    if (err) {
      console.log(err);
    } else {
      connection.close();
    }
  });
  connection.execSql(request);
}

// let runDBssssStatement = (backupDBName, dbName, bakFile, uploadDir) => {
//   var request = new Request("RESTORE DATABASE YourDBName " +
//   "FROM DISK='"+bakFile+"' " +
//   "WITH MOVE '"+backupDBName+"' TO '" + uploadDir + backupDBName + ".mdf', " +
//   "MOVE '"+backupDBName+"_log' TO '" + uploadDir + backupDBName + ".ldf'", (err) => {
//     if (err) {
//       console.log(err);
//     } else {
//       connection.close();
//       console.log(rowCount + ' rows');
//     }
//   });
//   connection.execSql(request);
// }
