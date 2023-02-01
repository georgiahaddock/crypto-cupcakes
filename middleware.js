const {User} = require('./db')

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

  const errorHandle = (error, req, res, next) => {
    console.error('SERVER ERROR: ', error);
    if(res.statusCode < 400) res.status(500);
    res.send({error: error.message, name: error.name, message: error.message});
  }

  module.exports = {getUser, errorHandle}