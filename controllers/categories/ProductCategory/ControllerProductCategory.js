const ModelProductCategory = require('./ModelProductCategory');
const ModelShopOwner = require('../../shopowner/ModelShopOwner')
const ModelProduct = require("../../products/ModelProduct");
// hàm get all có 2 cái sài cái nào cũng được nha 

// Get all productCategories with pagination and optional keyword search
const getAll = async (page = 1, limit = 10, keyword = '') => {
    try {
        page = parseInt(page);
        limit = parseInt(limit);
        const skip = (page - 1) * limit;
        const sort = { created_at: -1 };

        let query = {};
        if (keyword) {
            query.name = { $regex: keyword, $options: 'i' };
        }

        const categories = await ModelProductCategory
            .find(query, 'name description shopOwner')
            .skip(skip)
            .limit(limit)
            .sort(sort);

        return categories;
    } catch (error) {
        console.error('Get all category products error:', error);
        throw new Error('Unable to fetch categories');
    }
};

// Get all productCategories without pagination
const getAllCategories = async () => {
    try {
        const categories = await ModelProductCategory.find({}, 'name description');
        return categories;
    } catch (error) {
        console.error('Get all categories error:', error);
        throw new Error('Unable to fetch categories');
    }
};

// Get productCategory of Shop by ID 
const getCategoryById = async (id) => {
    try {
        const category = await ModelProductCategory.findById(id, 'name description shopOwner isDeleted');
        if (!category) {
            throw new Error('Category not found');
        }
        return category;
    } catch (error) {
        console.error('Get category by ID error:', error);
        throw new Error('Unable to fetch category');
    }
};

// Get productCategory of Shop by Shop ID
const getProductsCategoriesByShopID = async (shopOwner_id, page, limit) => {
    try {
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        const skip = (page - 1) * limit;
        const sort = { create_at: -1 };

        const products = await ModelProductCategory
            .find(
                { 'shopOwner.shopOwner_id': shopOwner_id },
                'name description shopOwner isDeleted')
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .exec();

        return products;
    } catch (error) {
        console.log('Get productCategory by shop ID error:', error);
        throw new Error('Get productCategory by shop ID error');
    }
};


// Insert new productCategory
const insert = async (name, description, shopOwner_id) => {
    try {

        const shopOwnerInDB = await ModelShopOwner.findById(shopOwner_id);
        if (!shopOwnerInDB) {
            throw new Error('Shop owner not found');
        }

        const productCategory = new ModelProductCategory({
            name,
            description,
            shopOwner: {
                shopOwner_id: shopOwnerInDB._id,
                shopOwner_name: shopOwnerInDB.name
            }
        });

        const result = await productCategory.save();
        return result;
    } catch (error) {
        console.error('Insert category product error:', error);
        throw new Error('Unable to insert category');
    }
};

// Update productCategory by ID
const update = async (id, name, description) => {
    try {
        const categoryInDB = await ModelProductCategory.findById(id);
        if (!categoryInDB) {
            throw new Error('Category not found');
        }

        categoryInDB.name = name || categoryInDB.name;
        categoryInDB.description = description || categoryInDB.description;
        categoryInDB.updated_at = Date.now();

        const result = await categoryInDB.save();
        return result;
    } catch (error) {
        console.error('Update category product error:', error);
        throw new Error('Unable to update category');
    }
};

// Remove productCategory by ID
const remove = async (id) => {
    try {
        const categoryInDB = await ModelProductCategory.findById(id);
        if (!categoryInDB) {
            throw new Error('Category not found');
        }    
        // Kiểm tra xem có sản phẩm nào thuộc về danh mục này không
        const productsInCategory = await ModelProduct.find({
          categories: { $elemMatch: { categoryProduct_id: id } },
        });
        if (productsInCategory.length > 0) {
          throw new Error("The category already exists in the products");
        }

        const result = await ModelProductCategory.findByIdAndDelete(id);
        return result;
    } catch (error) {
        throw new Error(error);
    }
};

// Cập nhật sản phẩm thành xóa mềm và chuyển trạng thái thành 'Tài khoản bị khóa'
const removeSoftDeleted = async (id) => {
    try {
        const productcategoryInDB = await ModelProductCategory.findById(id);
        if (!productcategoryInDB) {
            throw new Error('productcategory not found');
        }
  
        // Cập nhật trạng thái isDeleted và status
        let result = await ModelProductCategory.findByIdAndUpdate(
            id,
            { isDeleted: true },
            { new: true } // Trả về document đã cập nhật
        );
        return result;
    } catch (error) {
        console.log('Remove productcategory error:', error);
        throw new Error('Remove productcategory error');
    }
  };
  
  // Khôi phục trạng thái cho shop 
const restoreAndSetAvailable = async (id) => {
    try {
        const productcategoryInDB = await ModelProductCategory.findById(id);
        if (!productcategoryInDB) {
            throw new Error('productcategory not found');
        }
  
        // Cập nhật trạng thái
        const result = await ModelProductCategory.findByIdAndUpdate(
            id,
            { isDeleted: false },
            { new: true } // Trả về document đã cập nhật
        );
        return result;
    } catch (error) {
        console.log('Restore productcategory error:', error);
        throw new Error('Restore productcategory error');
    }
  };

module.exports = { 
    getAll, 
    getAllCategories, 
    getCategoryById, 
    insert, update, 
    remove, 
    getProductsCategoriesByShopID,
    removeSoftDeleted,
    restoreAndSetAvailable
 };
