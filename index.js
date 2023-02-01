require('dotenv').config('.env');
require('jsonwebtoken');
const cors = require('cors');
const express = require('express');
const app = express();
const morgan = require('morgan');
const { PORT = 3000 } = process.env;
// TODO - require express-openid-connect and destructure auth from it
const {auth, requiresAuth } = require('express-openid-connect');
const { User, Cupcake } = require('./db');

// middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({extended:true}));

//Create a new piece of middleware that will run right after the Auth0 auth(config) router.
//Inside this middleware, use Sequelize’s findOrCreate to find a user if they exist, or create one!  
//To findOrCreate you should pass the username, name, and email.
const getUser = async (req, res, next) => {
  try{
  const {nickname, email} = req.oidc.user;
  const [user] = await User.findOrCreate({ where: {username: nickname, email: email} });
  console.log(user);
  next();
  }catch(err){
    console.log(err,"failed to find or create a user");
    next(err);
  }
};

/* *********** YOUR CODE HERE *********** */
// follow the module instructions: destructure config environment variables from process.env
const {
  AUTH0_SECRET, // generate one by using: `openssl rand -base64 32`
  AUTH0_AUDIENCE,
  AUTH0_CLIENT_ID,
  AUTH0_BASE_URL,
  JWT_SECRET
} = process.env;

const config = {
  authRequired: true, // this is different from the documentation
  auth0Logout: true,
  secret: AUTH0_SECRET,
  baseURL: AUTH0_AUDIENCE,
  clientID: AUTH0_CLIENT_ID,
  issuerBaseURL: AUTH0_BASE_URL
};

// follow the docs:
// define the config object
// attach Auth0 OIDC auth router:auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));
app.use(getUser);


// create a GET / route handler that sends back Logged in or Logged out: req.isAuthenticated is provided from the auth router
app.get('/', (req, res) => {
  try{
  res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
  } catch(err){
    console.log(err);
    next(err);
  }
});


app.get('/cupcakes', async (req, res, next) => {
  try {
    const cupcakes = await Cupcake.findAll();
    res.send(cupcakes);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

app.get('/profile', (req, res, next) =>{
  try{
    console.log(req.oidc.user);
    res.send(res.send(req.oidc.user));
  }catch(err){
    console.error(err);
    next(err);
  }
})

// error handling middleware
app.use((error, req, res, next) => {
  console.error('SERVER ERROR: ', error);
  if(res.statusCode < 400) res.status(500);
  res.send({error: error.message, name: error.name, message: error.message});
});

app.listen(PORT, () => {
  console.log(`Cupcakes are ready at http://localhost:${PORT}`);
});

