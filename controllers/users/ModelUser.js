const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const OrderSchema = require('../order/ModelOrder').schema;
const UserAddressSchema = require('../address/User/ModelAddressUser').schema;
const CartSchema = require('../cart/CartModel').schema;

const UserSchema = new Schema({
    name: { type: String, required: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: String, enum: ['customer', 'shopOwner', 'shipper'], default: 'customer' },
    email: { type: String, required: true, unique: true },
    image: { type: String, default: "https://static.vecteezy.com/system/resources/previews/005/005/788/non_2x/user-icon-in-trendy-flat-style-isolated-on-grey-background-user-symbol-for-your-web-site-design-logo-app-ui-illustration-eps10-free-vector.jpg" },
    verified: { type: Boolean, default: false },
    orders: { type: [OrderSchema], default: [] },
    carts: { type: [CartSchema], default: [] },
    address: { type: [UserAddressSchema], default: [] },
    birthday: { type: Date, default: null },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    status: { 
        type: String, 
        enum: ['Hoạt động', 'Tài khoản bị khóa', 'Tài khoản vừa tạo chờ xác thực OTP'], 
        default: 'Tài khoản vừa tạo chờ xác thực OTP' 
    },
    isDeleted: { type: Boolean, required: false, default: false },
    otp: { type: String, default: '' },
    otpExpiry: { type: Date, default: '' },
    RegisterExpiry: { type: Date, default: () => Date.now() + 60 * 60 * 1000 },  // Tự động set thời gian hết hạn sau 60 phút

});

module.exports = mongoose.models.user || mongoose.model('user', UserSchema);
