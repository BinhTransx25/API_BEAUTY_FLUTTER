const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const UserAddressSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    recipientName: { type: String, required: true },
    address: { type: String, required: true },
    latitude: { type: Number, required: false },  // Vĩ độ
    longitude: { type: Number, required: false },  // Kinh độ
    phone: { type: String, required: true },
    label: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.models.userAddress || mongoose.model('userAddress', UserAddressSchema);
