require('dotenv').config('.env');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const express = require('express');
const app = express();
const morgan = require('morgan');
const { PORT = 3000 } = process.env;
// TODO - require express-openid-connect and destructure auth from it
const {auth, requiresAuth } = require('express-openid-connect');
const { User, Cupcake } = require('./db');
const {getUser, errorHandle} = require('./middleware.js')

// middleware
app.use(cors()).use(morgan('dev')).use(express.json()).use(express.urlencoded({extended:true}));

/* *********** YOUR CODE HERE *********** */
// follow the module instructions: destructure config environment variables from process.env
const {
  AUTH0_SECRET, 
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

app.get('/me', async (req, res, next) =>{
  console.log(req.oidc.user);
  try{
    const {email} = req.oidc.user;
    const user = await User.findOne(
      {where:
        {email}
      },
    )
    if(user){
      const token = jwt.sign(user.toJSON(), JWT_SECRET, { expiresIn: '1w' })
      res.send({user: user.toJSON(), token});
    }else{
      res.status(404).send(`no user found. please log in`)
    }
  }catch(err){
    next(err);
  }
})

// error handling middleware
app.use(errorHandle);

app.listen(PORT, () => {
  console.log(`Cupcakes are ready at http://localhost:${PORT}`);
});

