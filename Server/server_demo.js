var fname, urll, length;
var fsname = [];
var fsurl = [];

const http = require("http");

let { getStorage, ref, getDownloadURL, uploadBytes } = require("firebase/storage");
// Import the functions you need from the SDKs you need
let { initializeApp } = require("firebase/app");
// let { getAnalytics } = require("firebase/analytics");

const admin =  require("firebase-admin");

const multer = require('multer');
const firebase = require('firebase/app')

const express = require('express');
const app = express();

const path = require('path'); 

const cors = require('cors');
const { async } = require("@firebase/util");
const { url } = require("inspector");
const { log } = require("console");
// const { async } = require("@firebase/util");

require('dotenv').config();

const port = process.env.PORT || 8080;

app.use(express.urlencoded({extended: true}));
app.use(cors());
app.use(express.json());
app.set('view engine', 'ejs');

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.apiKey,
  authDomain: process.env.authDomain,
  projectId: process.env.projectId,
  storageBucket: process.env.storageBucket,
  messagingSenderId: process.env.messagingSenderId,
  appId: process.env.appId,
  measurementId: process.env.measurementId
};

const credential = {
  type: process.env.type,
  project_id: process.env.project_id,
  private_key_id: process.env.private_key_id,
  private_key: process.env.private_key,
  client_email: process.env.client_email,
  client_id: process.env.client_id,
  auth_uri: process.env.auth_uri,
  token_uri: process.env.token_uri,
  auth_provider_x509_cert_url: process.env.auth_provider_x509_cert_url,
  client_x509_cert_url: process.env.client_x509_cert_url,
  universe_domain: process.env.universe_domain,
}


admin.initializeApp({
  credential: admin.credential.cert(credential),
});

firebase.initializeApp(firebaseConfig);

const db = admin.firestore();

const storage = getStorage();
const upload = multer({storage: multer.memoryStorage()});
// Initialize Firebase
const firebaseinit = initializeApp(firebaseConfig);
// const analytics = getAnalytics(firebaseinit);

const storageRef = ref(storage);


const folderRef = ref(storageRef, 'media');

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});


app.post('/uploadvid', upload.single("video"), (req, res) => {
  if(!req.file) {
    res.status(400).send("No File uploaded");
    return;
  }
  const fileRef = ref(folderRef, req.file.originalname);
  console.log("fileref: "+fileRef);
  const metadata = {
    contentType: 'video/*',
  };
  uploadBytes(fileRef, req.file.buffer, metadata)
  .then(() => {
    getDownloadURL(fileRef).then(url => {
      fname = fileRef.name
      console.log("fname: "+ fileRef.name);
      console.log("url: " + url);
      urll = url 
      res.send(fileRef);
      console.log("fname: "+ fname);
      console.log("urll: " + urll);
      call_create();
    })
    .catch(err => {
      console.log(err);
      res.status(500).send(err);
    })
  })
})


app.post('/uploadaud', upload.single("audio"), (req, res) => {
  if(!req.file) {
    res.status(400).send("No File uploaded");
    return;
  }
  const fileRef = ref(folderRef, req.file.originalname);
  const metadata = {
    contentType: 'audio/*',
  };
  uploadBytes(fileRef, req.file.buffer, metadata)
  .then(() => {
    getDownloadURL(fileRef).then(url => {
      fname = fileRef.name
      urll = url 
      console.log("fileRef: "+ JSON.stringify(req.file.size));
      res.send({url});
      console.log("fname: "+ fname);
      console.log("urll: " + urll);
      call_create();
    })
    .catch(err => {
      console.log(err);
      res.status(500).send(err);
    })
  })
})


app.post('/create', async (req, res) => {
  console.log("Calling Create api");
  try {
    // call_read();
    let idfs = req.body.name;
    const userJson = {
      name: req.body.name,
      url: req.body.url
    };
    console.log(process.env.collectionName);
    console.log("fname: "+ fname);
    console.log("urll: " + urll);
    // await db.collection(process.env.collectionName).add(userJson);
    console.log("Calling Create api2");
    const response = await db.collection(process.env.collectionName).doc(idfs).set(userJson);
    console.log("Calling Create api3");
    //res.send(response);
    // console.log(response);
    res.send("success");
    console.log("success");
  } catch (error) {
    res.send(error);
  }
});

function call_create() {

  const options = {
    "method": "POST",
    "hostname": "localhost",
    "port": "8080",
    "path": "/create",
    "headers": {
      "Accept": "*/*",
      "User-Agent": "Thunder Client (https://www.thunderclient.com)",
      "Content-Type": "application/json"
    }
  };
  
  const req = http.request(options, function (res) {
    const chunks = [];
  
    res.on("data", function (chunk) {
      chunks.push(chunk);
    });
  
    res.on("end", function () {
      const body = Buffer.concat(chunks);
      console.log(body.toString());
    });
  });
  
  req.write(JSON.stringify({name: fname, url: urll}));
  req.end();

}

app.get('/read', async (req, res) => {
  try {
    const userRef = db.collection(process.env.collectionName);
    const response = await userRef.get();
    // console.log('response: ', response);
    let responseArr = [];

    if (response.empty) {
      console.log('No matching documents.');
      res.status(201).send('No documents');
    }
    response.forEach(doc => {
      responseArr.push(doc.data());
    });
    for (let j = 0; j < responseArr.length; j++) {
      fsname[j] = responseArr[j]["name"];
      fsurl[j] = responseArr[j]["url"];
    }
    console.log("Respnse[0]: " + responseArr[0]);
    length = responseArr.length;
    console.log("fsname: "+fsname[0]);
    // console.log("ResArr: " + JSON.stringify(responseArr[0]["name"]));
    // console.log("Data: " + d);
    res.status(200).send(responseArr);
    console.log(responseArr.length);
  } catch (error) {
    res.send(error);
  }
});


function call_get() {

  const options = {
  "method": "GET",
  "hostname": "localhost",
  "port": "8080",
  "path": "/main",
  "headers": {
    "Accept": "*/*",
    "User-Agent": "Thunder Client (https://www.thunderclient.com)"
  }
};

const req = http.request(options, function (res) {
  const chunks = [];

  res.on("data", function (chunk) {
    chunks.push(chunk);
  });

  res.on("end", function () {
    const body = Buffer.concat(chunks);
    console.log(body.toString());
  });
});

req.end();
}

app.engine('html', require('ejs').renderFile);

app.get('/main', function(req, res) {

  res.render(__dirname + "../../Client/index.html", {name: fname, url: urll, fsname: fsname, fsurl: fsurl, length: length});

});

app.get('/user', function(req, res){
  res.render('../home', {name:urll});
});

call_get();