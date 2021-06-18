const mongoose = require('mongoose');
const express = require('express');
const config = require('config');
const users = require('./routes/users');
const groups = require('./routes/group');
const cors = require('cors');
const app = express();

if (!config.get('jwtPrivateKey')) {
  console.error('jwt Key Not defined');
  process.exit(1);
}

//Mongo Atlas Connection String - (Should be kept in .env file)
mongoose
  .connect(
    'mongodb+srv://ajay:*****@first-cluster.ynakn.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => console.log('Connected to MongoDB....'))
  .catch((err) => console.error('Could not connect...', err));

app.use(cors({ origin: '*' })); //allowing CORS permission to load the resources
app.use(express.json());
app.use(express.json());
app.use('/users', users); //user API routes
app.use('/group', groups); //groups API routes

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));
