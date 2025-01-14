const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CartSchema = new Schema({
    user: { type: Object, required: true },
    shopOwner: { type: Object, required: true }, // thông tin chủ cửa hàng
    products: [
        {
            _id: { type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true },
            name: { type: String, required: true },
            price: { type: Number, required: true },
            images: { type: Array, required: true },
            quantity: { type: Number, required: true, default: 1 }, // Số lượng sản phẩm
            note: { type: String, default: '' }, // Thêm cột note
        }
    ], // mảng chứa các sản phẩm
    status: { type: String, default: 'pending' }, // trạng thái giỏ hàng
    totalItem: { type: Number, default: 0 }, // tổng số lượng sản phẩm
    totalPrice: { type: Number, default: 0 }, // tổng tiền của tất cả sản phẩm
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },

});

module.exports = mongoose.models.cart || mongoose.model('cart', CartSchema);
