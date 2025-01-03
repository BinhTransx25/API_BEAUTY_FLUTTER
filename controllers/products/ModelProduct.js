const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    images: { type: Array, required: true, default: [] },
    categories: [
        { 
            categoryProduct_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductCategory', required: true },
            categoryProduct_name: { type: String, required: true }
        }
    ],
    description: { type: String, required: true },
    rating: { type: Number, required: false,default: 0 },
    soldOut: { type: Number, required: false, default: 0 },
    create_at: { type: Date, default: Date.now },
    update_at: { type: Date, default: Date.now },
    shopOwner: { 
        shopOwner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'shopOwner', required: true },
        shopOwner_name: { type: String, required: true }
    },
    status: { type: String, enum: ['Còn món', 'Hết món', 'Ngừng bán' ], default: 'Còn món' },
    isDeleted:{type:Boolean, required:false, default:false},
    note: { type: String, required: false,default:'' },
    
});

module.exports = mongoose.models.product || mongoose.model('product', ProductSchema);
