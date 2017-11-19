const express = require('express')
const app = express()
const Connection = require('tedious').Connection;
const Request = require('tedious').Request;
const uniqid = require('uniqid');
const formidable = require('formidable');
const extract = require('extract-zip')
const fs = require('fs');
const path = require('path');
const xmlBuilder = require('xmlbuilder');

app.use(express.static('./'));

const config = {
  userName: 'SA',
  password: '!HimnarK2RDP#',
  server: 'localhost',
  options: {
    rowCollectionOnRequestCompletion: true
  }
}

var connection = new Connection(config);
var isConnected = false;
connection.on('connect', function(err) {
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
                  restoreDatabase('Salary', dbName, bakFilepath, uploadDir, getEmployeeList); // We shoudl be sure that all databases of AS has Salay name
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

var restoreDatabase = (logicalName, dbName, bakFile, uploadDir, callback) => {
  fs.chmodSync(uploadDir, '777'); // hope that this is the temprorary solution, mssql should have write access to uploadDir
  let sql = "RESTORE DATABASE " + dbName + " " +
    "FROM DISK='" + bakFile + "' " +
    "WITH MOVE '" + logicalName + "' TO '" + uploadDir + dbName + ".mdf', " +
    "MOVE '" + logicalName + "_log' TO '" + uploadDir + dbName + ".ldf'";
  let request = new Request(sql, (err, rowCount, rows) => {
    if (err) {
      console.log(err);
    } else {
      callback(dbName)
    }
  });
  connection.execSql(request);
};

var getEmployeeList = (dbName) => {
  let sql = 'SELECT * FROM [' + dbName + '].[dbo].[EMPLOYEES] EMP LEFT JOIN [' + dbName + '].[dbo].[ATTACHMENTS] ATCH ON EMP.fEMPLISN = ATCH.fISN;';
  let request = new Request(sql, (err, rowCount, rows) => {
    if (err) {
      console.log(err);
    } else {
      getEmployeeListXML(rows)
    }
  });
  connection.execSql(request);
};

var getEmployeeListXML = (rows) => {
  var xmlJSObject = {
    'Exchange': {
      '@xmlns': 'http://www.armsoft.am/Accountant/6.0',
      'Employee': []
    }
  };

var employee = {
    'Code': '',
    'FullName': '',
    'Birthday': '',
    'WGContract': '',
    'DateOn': '',
    'InOrderNumber': '',
    'DateOff': '',
    'OffOrderNumber': '',
    'Department': '',
    'Position': '',
    'Profession': '',
    'Gender': '',
    'SocCardNumber': '',
    'Phone': '',
    'MobilePhone': '',
    'Email': '',
    'IDDocType': '',
    'Passport': '',
    'GivenDate': '',
    'GivenBy': '',
    'Nationality': '',
    'OtherDocumentNumber': '',
    'DepositAcc': '',
    'Resident': '',
    'IncomeTax': '',
    'SalaryAccount': '',
    'TradeUnionPercent': '',
    'RegistrationPlace': '',
    'Region1': '',
    'Commune1': '',
    'City1': '',
    'Street1': '',
    'House1': '',
    'Apartment1': '',
    'IsRegisteredInSameStay': '',
    'StayPlace': '',
    'Country2': '',
    'Region2': '',
    'Commune2': '',
    'City2': '',
    'Locality': '',
    'Street2': '',
    'House2': '',
    'Apartment2': '',
    'AddressLine1': '',
    'AddressLine2': '',
    'AddressLine3': '',
    'PostalNumber': '',
    'EmployeeLanguages': '',
    'Education': '',
    'Institute': '',
    'EduBeginDate': '',
    'EduEndDate': '',
    'EduCertificateNumber': '',
    'MilitaryService': '',
    'MilitaryServiceBeginDate': '',
    'MilitaryServiceEndDate': '',
    'FamilyMember1': '',
    'FamilyMemberFullName1': '',
    'FamilyMember2': '',
    'FamilyMemberFullName2': '',
    'FamilyMember3': '',
    'FamilyMemberFullName3': '',
    'FamilyMember4': '',
    'FamilyMemberFullName4': '',
    'MaritalStatus': '',
    'DatePositionStart': '',
    'Participation': '',
    'PartnerCode': '',
    'EmployerPerc': '',
    'EmployerSumm': '',
    'ReducePension': '',
    'StampFee': '',
    'EmplFeeHolds': '',
    'Extension': '',
    'Image': '',
    'Attachments': '',
  };
  var employeeMap = {
    'fADDRESSLINE1': 'AddressLine1',
    'fADDRESSLINE2': 'AddressLine2',
    'fADDRESSLINE3': 'AddressLine3',
    'fAPARTMENT1': 'Apartment1',
    'fAPARTMENT2': 'Apartment2',
    'fBIRTHDAY': 'Birthday',
    'fCAPTION': 'FullName',
    'fCITY1': 'City1',
    'fCITY2': 'City2',
    'fCOMMUNE1': 'Commune1',
    'fCOMMUNE2': 'Commune2',
    'fCOUNTRY2': 'Country2',
    'fDATEOFF': 'DateOff',
    'fDATEON': 'DateOn',
    'fDEPARTMENT': 'Department',
    'fDEPOSITACC': 'DepositAcc',
    'fEDUBEGINDATE': 'EduBeginDate',
    'fEDUCATION': 'Education',
    'fEDUCERTIFICATENUMBER': 'EduCertificateNumber',
    'fEDUENDDATE': 'EduEndDate',
    'fEMAIL': 'Email',
    'fEMPLCODE': 'Code',
    'fEMPLOYEELANGUAGES': 'EmployeeLanguages',
    'fEMPLOYERPERC': 'EmployerPerc',
    'fEMPLOYERSUMM': 'EmployerSumm',
    'fFAMILYMEMBER1': 'FamilyMember1',
    'fFAMILYMEMBER2': 'FamilyMember2',
    'fFAMILYMEMBER3': 'FamilyMember3',
    'fFAMILYMEMBER4': 'FamilyMember4',
    'fFAMILYMEMBERFULLNAME1': 'FamilyMemberFullName1',
    'fFAMILYMEMBERFULLNAME2': 'FamilyMemberFullName2',
    'fFAMILYMEMBERFULLNAME3': 'FamilyMemberFullName3',
    'fFAMILYMEMBERFULLNAME4': 'FamilyMemberFullName4',
    'fGIVENBY': 'GivenBy',
    'fGIVENDATE': 'GivenDate',
    'fHOUSE1': 'House1',
    'fHOUSE2': 'House2',
    'fIDDOCTYPE': 'IDDocType',
    'fIMAGE': 'Image',
    'fINCOMETAX': 'IncomeTax',
    'fINORDERNUM': 'InOrderNumber',
    'fINSTITUTE': 'Institute',
    'fISREGSAMESTAY': 'IsRegisteredInSameStay',
    'fLOCALITY': 'Locality',
    'fMARITALSTATUS': 'MaritalStatus',
    'fMILITARYSERVICE': 'MilitaryService',
    'fMILITARYSERVICEBEGINDATE': 'MilitaryServiceBeginDate',
    'fMILITARYSERVICEENDDATE': 'MilitaryServiceEndDate',
    'fMOBILEPHONE': 'MobilePhone',
    'fNATIONALITY': 'Nationality',
    'fOFFORDERNUM': 'OffOrderNumber',
    'fOTHERDOCNUM': 'OtherDocumentNumber',
    'fPARTICIPATION': 'Participation',
    'fPARTID': 'PartnerCode',
    'fPASSPORT': 'Passport',
    'fPHONE': 'Phone',
    'fPOSITION': 'Position',
    'fPOSITIONSTART': 'DatePositionStart',
    'fPOSTALNUMBER': 'PostalNumber',
    'fPROFESSION': 'Profession',
    'fREDUCEPENSION': 'ReducePension',
    'fREGION1': 'Region1',
    'fREGION2': 'Region2',
    'fREGPLACE': 'RegistrationPlace',
    'fRESIDENT': 'Resident',
    'fSALARYACCOUNT': 'SalaryAccount',
    'fSEX': 'Gender',
    'fSOCCARDNUM': 'SocCardNumber',
    'fSTAMPFEE': 'StampFee',
    'fSTAYPLACE': 'StayPlace',
    'fSTREET1': 'Street1',
    'fSTREET2': 'Street2',
    'fTRADEUNIONPERC': 'TradeUnionPercent',
    'fWGCONTRACT': 'WGContract'
  }
  rows.forEach((row) => {
    var employeeInstance = JSON.parse(JSON.stringify(employee));
    row.forEach((column) => {
      var value = column.value;
      if (column.metadata.type.type === 'DATETIMN' && column.value) {
        value = value.toISOString().replace(/\..+/, '');
      }
      employeeInstance[employeeMap[column.metadata.colName]] = value;
    });
    employeeInstance['@xmlns:i'] = 'http://www.w3.org/2001/XMLSchema-instance';
    xmlJSObject.Exchange.Employee.push(employeeInstance);
  });
  xml = xmlBuilder.create(xmlJSObject, { encoding: 'utf-8' }).end({ pretty: true });
  console.log(xml);
};