require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
//session
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const MongoDBStore = require('connect-mongodb-session')(session);

const adminId = "6070660f67e3fd4d3003abb3";
let admin = false;



mongoose.connect(process.env.MONGO_CONNECT, {useUnifiedTopology: true, useNewUrlParser: true});

//passportLocalMongoose
mongoose.set('useCreateIndex', true);



const app = express();




app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

//passport & session

var store = new MongoDBStore({
  uri: process.env.MONGO_CONNECT,
  collection: 'mySessions'
});
store.on('error', function(error) {
  if(error){
    console.log(err)
  }else {
    console.log('session created succesfully')
  }
});

app.use(session({
  secret: process.env.SECRET2,
  resave: false,
  saveUninitialized: false,
  secret: process.env.SECRET,
  cookie: {
   maxAge: 1000 * 60 * 60 * 1 // 1 hour
  },
  store: store,
}));

app.use(passport.initialize());
app.use(passport.session());




const productSchema = new mongoose.Schema({
  title: String,
  details: String,
  img1: String,
  img2: String,
  img3: String,
  category: String,
  price: String

});

const ProductDetail = mongoose.model('ProductDetail', productSchema);

const userSchema = new mongoose.Schema({

  name: String,
  email : String,
  password: String
});
//passportLocalMongoose;
userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

//passportLocalMongoose
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());




//HOME ROUTE
app.get('/', function(req, res){
  //check if user is admin

  if (req.isAuthenticated()){
    if (req.user._id == adminId){
      admin = true
    }
  }



  ProductDetail.find().lean().exec((err, docs)=>{



const newProducts = docs.reverse().slice(0, 3);
const popularProducts = docs.reverse().slice(0, 6);

res.render('index', {products: newProducts, admin:admin, popular: popularProducts, authenticate:req.isAuthenticated()});
});

  //res.render('index')
});


// LOGIN ROUTE
app.get('/login', function(req, res){
  err = req.query.value
  res.render('login', {error:err, admin:admin, authenticate:req.isAuthenticated()})
});

app.post('/login', function(req, res){
  //check if user is loging from checkoutpage so as to redirect back to checkout else redirect to home page
  if (req.body.checkout){
    User.findOne({'username' : new RegExp(req.body.username, 'i')}, function(err, docs){
      let errorMessage = ''
        if (docs){
          docs.authenticate(req.body.password, function(err, model, passwordError){
            if (passwordError){
              errorMessage = 'incorrect password'
              res.redirect('/checkout?value=' + errorMessage)
            } else{
              if (model){
                passport.authenticate("local")(req, res, function(){
                        console.log(req.isAuthenticated());
                        //tell user is admin
                        if (req.isAuthenticated()){
                          if (req.user._id == adminId){
                            admin = true
                          }
                        }
                        res.redirect("/checkout");
                      });
              }
            }
          })
        } else {
          errorMessage = 'incorrect Email'
          res.redirect('/checkout?value=' + errorMessage)
        }
      });


  } else{
    User.findOne({'username' : new RegExp(req.body.username, 'i')}, function(err, docs){
      let errorMessage = ''
        if (docs){
          docs.authenticate(req.body.password, function(err, model, passwordError){
            if (passwordError){
              errorMessage = 'incorrect password'
              res.redirect('/login?value=' + errorMessage)
            } else{
              if (model){
                passport.authenticate("local")(req, res, function(){
                        console.log(req.isAuthenticated());
                        //tell user is admin
                        if (req.isAuthenticated()){
                          if (req.user._id == adminId){
                            admin = true
                          }
                        }
                        res.redirect("/");
                      });
              }
            }
          })
        } else {
          errorMessage = 'incorrect Email'
          res.redirect('/login?value=' + errorMessage)
        }
  });

  }

});

//LOGOUT ROUTE
app.get('/logout', function(req, res){
  if (req.session) {
       // delete session object
       req.session.destroy(error => {
           req.session = null;
       });
     }
  admin = false
  req.logout();
  res.redirect("/");
});

// SIGN UP ROUTE
app.get('/signup', function(req, res){
  var err = req.query.value
  res.render('create-account', {error:err, admin:admin, authenticate:req.isAuthenticated()})
});
app.post('/signup', function(req, res){
        // authenticate user with login details

      User.register({name: req.body.name, username: req.body.username}, req.body.password, function(err, user){
        if (err) {
          var error = encodeURIComponent('User already exist please log in');
          console.log(err);
          res.redirect('/signup?value=' + error);
        } else {
          passport.authenticate("local")(req, res, function(){
            console.log(req.isAuthenticated());
            res.redirect("/");
          });
        }
      });
});

app.get('/shop', function(req, res){
  //check if user is admin

  if (req.isAuthenticated()){
    if (req.user._id == adminId){
      admin = true
    }
  }

  ProductDetail.find().lean().exec(function(err, docs){

      newProducts = docs.reverse().slice(0, 6);
      res.render('shop', {products: newProducts, admin:admin, authenticate:req.isAuthenticated()});

    });


});

app.get('/about', function(req, res){
  res.render('about', {authenticate:req.isAuthenticated(), admin:admin})
});

app.get('/contact', function(req, res){
res.render('contact',{authenticate:req.isAuthenticated(), admin:admin})
});

app.get('/productdetails:id', function(req, res){
    let productId = req.params.id
    ProductDetail.findById(productId, function (err, doc) {
      res.render('product_details', {prod: doc,admin:admin, authenticate:req.isAuthenticated()})
    });
});


app.get('/upload', function(req, res){
  if (req.isAuthenticated()){
    if (req.user._id == adminId){
      res.render('upload',{product:'', links: '/upload', authenticate:req.isAuthenticated(), admin:admin})
  }else{
    res.sendStatus(404)
    console.log('no access')
  }
  }else{
    res.sendStatus(404)
    console.log('no access')
  }

});
app.post('/upload', function(req, res){

const watch = new ProductDetail({
  title: req.body.title,
  details: req.body.details,
  img1: req.body.img1,
  img2: req.body.img2,
  img3: req.body.img3,
  category:req.body.cat,
  price:req.body.price
});

watch.save();


  res.redirect('/')
});


app.get('/update:id', function(req, res){
  if (req.isAuthenticated()){
    if (req.user._id == adminId){
        let productId = req.params.id
        ProductDetail.findById(productId, function (err, doc) {
          res.render('upload', {product: doc, links: '/update'+productId, authenticate:req.isAuthenticated(), admin:admin})
        });
    } else {
      res.sendStatus(404)
      console.log('no access')
    }
} else {
  res.sendStatus(404)
  console.log('no access')
}
});
app.post('/update:id', function(req, res){
  ProductDetail.replaceOne({ _id: req.params.id }, {
    title: req.body.title,
    details: req.body.details,
    img1: req.body.img1,
    img2: req.body.img2,
    img3: req.body.img3,
    category:req.body.cat,
    price: req.body.price
  }, function(err){
    if(err){
      console.log(err)
    } else{console.log('successfully updated')}
  });

   res.redirect('/')
});

app.get('/delete:id', function(req, res){
  if (req.isAuthenticated()){
    if (req.user._id == adminId){
        ProductDetail.findByIdAndDelete(req.params.id, function(err){
          if(err){
            console.log(err);
          }else {
            console.log('product have been deleted succesfully')
          }
        });
        res.redirect('/')
      }else {
        res.sendStatus(404)
        console.log('no access')
      }
}else {
  res.sendStatus(404)
  console.log('no access')
}
});

app.get('/cart', function(req, res){
  var cart = req.session.cart;
  var displayCart = {items: [], total:0};
  var total = 0;

  // Get Total
  for(var item in cart){
    displayCart.items.push(cart[item]);
    total += (cart[item].qty * cart[item].price);
  }
  displayCart.total = total;

  // Render Cart
  res.render('cart', {carts: displayCart, admin:admin, authenticate:req.isAuthenticated()})

})
app.post('/cart:id', function(req, res){

		req.session.cart = req.session.cart || {};
		var cart = req.session.cart;

		ProductDetail.findOne({_id:req.params.id}, function(err, doc){
			if(err){
				console.log(err);
			}

			if(cart[req.params.id]){
				cart[req.params.id].qty = cart[req.params.id].qty + parseInt(req.body.qty)
        cart[req.params.id].accumSingleTotalcost = cart[req.params.id].qty * cart[req.params.id].price
			} else {
				cart[req.params.id] = {
					item: doc._id,
					title: doc.title,
					price: doc.price,
          img: doc.img1,
					qty: parseInt(req.body.qty),
          //singleTotalCost: doc.price,
          accumSingleTotalcost: parseInt(req.body.qty)*doc.price,
				}
			}

			res.redirect('/cart');
		});
	});

  app.get('/checkout', function(req, res){
    var authenticate = req.isAuthenticated()
    var err = req.query.value || ''

    var cart = req.session.cart;
    var displayCart = {items: [], total:0};
    var total = 0;
    // Get Total
    for(var item in cart){
      displayCart.items.push(cart[item]);
      total += (cart[item].qty * cart[item].price);
    }
    displayCart.total = total;

    res.render('checkout', { admin:admin, error:err, cart:displayCart, authenticate:req.isAuthenticated() })
  })



let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
//

app.listen(port, function(){
    console.log("listening at 8000");
});
