'use strict';
const express    = require('express');
const bodyParser = require('body-parser');
const cors       = require('cors');
require('dotenv').config();
const apiRoutes        = require('./routes/api.js');
const fccTestingRoutes = require('./routes/fcctesting.js');
const runner           = require('./test-runner');
const { MongoClient }  = require('mongodb');

const app = express();
app.use('/public', express.static(process.cwd() + '/public'));
app.use(cors({origin: '*'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Mount FCC & API routes sebelum connect biar Mocha bisa nemu handler-nya
fccTestingRoutes(app);
const client = new MongoClient(process.env.MONGO_URI);
const db = client.db('issue-tracker');
apiRoutes(app, db);

// Front-end route: tampilkan issue.html untuk path /:project/
app.route('/:project/')
  .get(function(req, res) {
    res.sendFile(process.cwd() + '/views/issue.html');
  });

// Index page
app.route('/')
  .get(function(req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

// 404 handler
app.use(function(req, res, next) {
  res.status(404)
     .type('text')
     .send('Not Found');
});

// Start koneksi & server
client.connect()
  .then(()=> {
    console.log('DB connected');
    const listener = app.listen(process.env.PORT||3000, ()=> {
      console.log('App listening on '+listener.address().port);
      if(process.env.NODE_ENV==='test') {
        console.log('Running Tests...');
        setTimeout(()=>{ runner.run(); }, 3500);
      }
    });
  })
  .catch(err=>{
    console.error('DB connection error:', err);
    process.exit(1);
  });

module.exports = app;
