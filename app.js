var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose = require('mongoose');
// kết nối với mongodb(egOs06SnjVLToRgU)
// Bình: gIzzTqWVtE6x4Urj
const atlas = 'mongodb+srv://nguyenminhkhuong318:egOs06SnjVLToRgU@cluster0.vd5pl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'

// Gọi swagger từ file swagger.js
const { swaggerUi, swaggerDocs } = require('./bin/swagger');

// gọi các model
require('./controllers/users/ModelUser');
require('./controllers/products/ModelProduct');
require('./controllers/categories/ShopCategory/ModelShopCategory');
require('./controllers/categories/ProductCategory/ModelProductCategory');
require('./controllers/order/ModelOrder');
require('./controllers/address/User/ModelAddressUser');
require('./controllers/shopowner/ModelShopOwner')
require('./controllers/shipper/ModelShipper')
require('./controllers/cart/CartModel')
require('./controllers/notification/ModelNotification')
require('./controllers/Review/ProductReview/ModelProductReview')
require('./controllers/Review/ShipperReview/ModelShipperReview')
require('./controllers/shopowner/ControllerShopOwner')

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var productsRouter = require('./routes/products');
var shopCategoriesRouter = require('./routes/shopCategories');
var productCategoriesRouter = require('./routes/productCategories');
var userAddressRouter = require('./routes/userAddress');
var shipperRouter = require('./routes/shipper');
var ordersRouter = require('./routes/orders');
var cartsRouter = require('./routes/carts');
var notificationRouter = require('./routes/notification');
var productReviewRouter = require('./routes/productReviews');
var shipperReviewRouter = require('./routes/shipperReviews');
var shopOwnerRouter = require('./routes/shopowner');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Sử dụng Swagger từ file swagger.js
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.get('/swagger.json', (req, res) => {
  res.json(swaggerDocs);
});

// kết nối với mongodb
mongoose.connect(atlas)
  .then(() => console.log('Connected to MongoDB...'))
  .catch(err => console.error('Could not connect to MongoDB...', err));

// Thiết lập các route
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/products', productsRouter);
app.use('/shopCategories', shopCategoriesRouter);
app.use('/productCategories', productCategoriesRouter);
app.use('/userAddresses', userAddressRouter);
app.use('/orders', ordersRouter);
app.use('/carts', cartsRouter);
app.use('/shipper', shipperRouter);
app.use('/notification', notificationRouter);
app.use('/productReviews', productReviewRouter);
app.use('/shipperReview', shipperReviewRouter);
app.use('/shopOwner', shopOwnerRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;