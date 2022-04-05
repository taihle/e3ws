'use strict';

const express = require('express');
const app = express();
var cors = require('cors');

// const session = require('cookie-session')
var mongoose = require('mongoose');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

//connect to MongoDB
mongoose.connect(process.env.MONGODB_URL_E3WS, { useNewUrlParser: true });
var e3ws_db = mongoose.connection;

//handle mongo error
e3ws_db.on('error', console.error.bind(console, 'connection error:'));
e3ws_db.once('open', function () {
  // we're connected!
});

//use sessions for tracking logins
app.use(session({
  secret: process.env.SESSION_SECRETE_PASS,
  resave: true,
  saveUninitialized: false,
  store: new MongoStore({
    mongooseConnection: e3ws_db
  })
}));

const bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/', express.static(__dirname));

// https://expressjs.com/en/advanced/best-practice-security.html
app.disable('x-powered-by')

var corsOptions = {
  origin: true,
  credentials: true 
};

app.use(cors(corsOptions));

// app.use(function (req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Credentials", true);
//   res.header("Access-Control-Allow-Headers", "Cache-Control, Pragma, Origin, Authorization, X-Requested-With, Content-Type, Accept");
//   res.header("Access-Control-Allow-Methods", "GET, PUT, POST");
//   next();
// });

app.get("/", function (req, res) {
  res.redirect('/home');
});

const e3wsroutes = require("./server/e3wsrouter.js");
const portalroutes = require("./server/portalrouter.js");
const roomroutes = require("./server/roomrouter.js");

e3wsroutes(app);
portalroutes(app);
roomroutes(app);

var port = process.env.PORT || 8051;

var http = require('http').Server(app);

const chatroutes = require("./server/chatrouter.js");
chatroutes(http);

http.listen(port, function () {
  var addr = http.address();
  console.log('e3ws is listening on ' + addr.address + addr.port);
});
