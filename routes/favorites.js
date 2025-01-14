const express = require('express');
const router = express.Router();
const FavoriteController = require('../controllers/favorites/FavoriteController');

/**
 * @swagger
 * /favorites/add:
 *   post:
 *     summary: Thêm cửa hàng vào danh sách yêu thích của user
 *     tags: [Favorite]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID của user
 *               shopOwnerId:
 *                 type: string
 *                 description: ID của cửa hàng
 *     responses:
 *       200:
 *         description: Cửa hàng đã được thêm vào danh sách yêu thích thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         email:
 *                           type: string
 *                         image:
 *                           type: string
 *                     shopOwner:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         rating:
 *                           type: number
 *                         images:
 *                           type: array
 *                           items:
 *                             type: string
 *                         address:
 *                           type: string
 *       500:
 *         description: Lỗi khi thêm vào danh sách yêu thích
 */
router.post('/add', async (req, res) => {
    const { userId, shopOwnerId } = req.body;
    try {
        const result = await FavoriteController.addFavorite(userId, shopOwnerId);
        return res.status(200).json({ status: true, data: result });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
});

/**
 * @swagger
 * /favorites/user/{userId}:
 *   get:
 *     summary: Lấy danh sách yêu thích của user
 *     tags: [Favorite]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của user
 *     responses:
 *       200:
 *         description: Danh sách các cửa hàng yêu thích của user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Lỗi khi lấy danh sách yêu thích
 */
router.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const favorites = await FavoriteController.getFavoritesByUser(userId);
        return res.status(200).json({ status: true, data: favorites });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
});

/**
 * @swagger
 * /favorites/shop/{shopOwnerId}:
 *   get:
 *     summary: Lấy danh sách yêu thích theo shop
 *     tags: [Favorite]
 *     parameters:
 *       - in: path
 *         name: shopOwnerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của shop
 *     responses:
 *       200:
 *         description: Danh sách các cửa hàng yêu thích theo shop
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Lỗi khi lấy danh sách yêu thích
 */
router.get('/shop/:shopOwnerId', async (req, res) => {
    const { shopOwnerId } = req.params;
    try {
        const favorites = await FavoriteController.getFavoritesByShopId(shopOwnerId);
        return res.status(200).json({ status: true, data: favorites });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
});

/**
 * @swagger
 * /favorites/delete:
 *   delete:
 *     summary: Xóa cửa hàng khỏi danh sách yêu thích của user
 *     tags: [Favorite]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID của user
 *               shopOwnerId:
 *                 type: string
 *                 description: ID của cửa hàng
 *     responses:
 *       200:
 *         description: Đã xóa khỏi danh sách yêu thích
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       500:
 *         description: Lỗi khi xóa khỏi danh sách yêu thích
 */
router.delete('/delete', async (req, res) => {
    const { userId, shopOwnerId } = req.body;
    try {
        const result = await FavoriteController.removeFavorite(userId, shopOwnerId);
        return res.status(200).json({ status: true, message: 'Đã xóa khỏi danh sách yêu thích', data: result });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
});

router.delete('/softdelete/:id', async function (req, res, next) {
    try {
        const favouriteId = req.params.id;
        const updatedFavourite = await ControllerUser.removeSoftDeleted(favouriteId);
  
        if (updatedUser) {
            return res.status(200).json({
                status: true,
                message: 'Favourite successfully soft deleted',
                data: updatedFavourite, // Trả về thông tin đã cập nhật
            });
        } else {
            return res.status(404).json({
                status: false,
                message: 'Favourite not found',
            });
        }
    } catch (error) {
        console.log('Delete Favourite error:', error);
        return res.status(500).json({ status: false, error: error.message });
    }
  });
  
  router.put('/restore/available/:id', async (req, res) => {
    try {
        const favouriteId = req.params.id;
        const updatedFavourite = await ControllerUser.restoreAndSetAvailable(favouriteId);
  
        return res.status(200).json({
            status: true,
            message: 'Favourite restored and set to available',
            data: updatedFavourite,
        });
    } catch (error) {
        console.log('Restore User error:', error);
        return res.status(500).json({ status: false, error: error.message });
    }
  });

module.exports = router;
