var express = require('express');
var router = express.Router();

const ControllerUser = require('../controllers/users/ControllerUser');

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Đăng ký người dùng
 *     description: Đăng ký người dùng mới với các thông tin bao gồm tên, email, mật khẩu, số điện thoại, vai trò, danh mục cửa hàng, địa chỉ, kinh độ và vĩ độ.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *               image:
 *                 type: Array
 *               rating:
 *                 type: string
 *               role:
 *                 type: string
 *               shopCategory_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *               address:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       200:
 *         description: Đăng ký thành công
 *       500:
 *         description: Lỗi khi đăng ký
 */
router.post('/register', async (req, res, next) => {
  const { name, email, password, phone, image, role, images, shopCategory_ids, address, latitude, longitude, verified, imageVerified } = req.body;
  try {
    let result = await ControllerUser.register(name, email, password, phone, image, role, images, shopCategory_ids, address, latitude, longitude, verified, imageVerified);
    return res.status(200).json({ status: true, data: result });
  } catch (error) {
    console.error('Error during registration:', error);
    return res.status(500).json({ status: false, message: error.message });
  }
});

router.post('/register_user', async (req, res, next) => {
  const { name, email, password, phone, role } = req.body;
  try {
    let result = await ControllerUser.registerUser(name, email, password, phone, role);

    if (result.errors) {
      return res.status(400).json({
        status: false,
        message: result.errors
      });
    }

    return res.status(200).json({ status: true, message: result.message });
  } catch (error) {
    console.error('Error during registration:', error);
    return res.status(500).json({ status: false, message: 'Lỗi hệ thống, vui lòng thử lại sau.' });
  }
});

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Đăng nhập người dùng
 *     description: Đăng nhập với email hoặc số điện thoại và mật khẩu.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identifier:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *       500:
 *         description: Lỗi khi đăng nhập
 */
router.post('/login_user', async (req, res, next) => {
  const { identifier, password } = req.body;
  try {
    let result = await ControllerUser.login_user(identifier, password);

    if (result.errors) {
      return res.status(400).json({
        status: false,
        message: result.errors
      });
    }


    return res.status(200).json({
      status: true, data: result
    });
  } catch (error) {
    console.error('Error during login_user:', error);
    return res.status(500).json({ status: false, message: error.message });
  }
});


/**
 * @swagger
 * /users/login-social:
 *   post:
 *     summary: Đăng nhập bằng tài khoản mạng xã hội
 *     description: Đăng nhập người dùng qua tài khoản mạng xã hội.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userInfo:
 *                 type: object
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *       500:
 *         description: Lỗi khi đăng nhập
 */
router.post('/login-social', async (req, res, next) => {
  const { userInfo } = req.body;
  try {
    let result = await ControllerUser.loginWithSocial(userInfo);
    return res.status(200).json({ status: true, data: result });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ status: false, message: error.message });
  }
});

/**
 * @swagger
 * /users/verify:
 *   post:
 *     summary: Xác minh email người dùng
 *     description: Xác minh email của người dùng qua việc gửi yêu cầu xác thực.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Xác minh thành công
 *       500:
 *         description: Lỗi khi xác minh
 */
router.post('/verify', async (req, res, next) => {
  const { email } = req.body;
  try {
    let result = await ControllerUser.verifyEmail(email);
    return res.status(200).json({ status: true, data: result });
  } catch (error) {
    console.error('Error during verify:', error);
    return res.status(500).json({ status: false, message: error.message });
  }
});

/**
 * @swagger
 * /users/reset-password:
 *   post:
 *     summary: Đặt lại mật khẩu người dùng
 *     description: Đặt lại mật khẩu cho tài khoản qua email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đặt lại mật khẩu thành công
 *       500:
 *         description: Lỗi khi đặt lại mật khẩu
 */
router.post('/reset-password', async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ errors: 'Vui lòng cung cấp email.' });
  }

  try {
    const result = await resetPassword(email);
    return res.status(200).json({ message: result.message });
  } catch (error) {
    return res.status(400).json({ errors: error.message });
  }
});

/**
 * @swagger
 * /users/check-user:
 *   post:
 *     summary: Kiểm tra thông tin người dùng
 *     description: Kiểm tra xem email có tồn tại trong hệ thống hay không.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Kiểm tra thành công
 *       500:
 *         description: Lỗi khi kiểm tra
 */
router.post('/check-user', async (req, res, next) => {
  const { email } = req.body;
  try {
    const result = await ControllerUser.checkUser(email);
    return res.status(200).json({ status: true, data: result });
  } catch (error) {
    console.error('Error during check email:', error);
    return res.status(500).json({ status: false, message: error.message });
  }
});

/**
 * @swagger
 * /update/{id}:
 *   put:
 *     summary: Cập nhật thông tin người dùng
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của người dùng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên người dùng
 *               phone:
 *                 type: string
 *                 description: Số điện thoại
 *               email:
 *                 type: string
 *                 description: Email
 *               password:
 *                 type: string
 *                 description: Mật khẩu
 *               image:
 *                 type: string
 *                 description: URL ảnh của người dùng
 *     responses:
 *       200:
 *         description: Thông tin người dùng đã được cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: Không tìm thấy người dùng
 *       500:
 *         description: Lỗi khi cập nhật thông tin người dùng
 */
router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, password, image, birthday } = req.body;
    const user = await ControllerUser.updateUser(id, name, phone, email, password, image, birthday);
    return res.status(200).json({ status: true, data: user });
  } catch (error) {
    if (error.message === 'Không Tìm Thấy Tài Khoản, Hãy thử lại') {
      return res.status(404).json({ status: false, message: error.message });
    }
    return res.status(500).json({ status: false, message: 'Lỗi khi cập nhật thông tin người dùng' });
  }
});

router.get('/', async (req, res) => {
  try {
    let result = await ControllerUser.getAllUsers();
    return res.status(200).json({ status: true, data: result });
  } catch (error) {
    return res.status(500).json({ status: false, data: error.message });
  }
});

/**
 * @swagger
 * /{id}:
 *   get:
 *     summary: Lấy thông tin user theo ID
 *     tags: [ShopOwner]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của user
 *     responses:
 *       200:
 *         description: Thông tin user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShopOwner'
 *       404:
 *         description: Không tìm thấy user
 *       500:
 *         description: Lỗi khi lấy thông tin user
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    let result = await ControllerUser.getUserById(id);
    return res.status(200).json({ status: true, data: result });
  } catch (error) {
    return res.status(500).json({ status: false, data: error.message });
  }
});

/**
 * @swagger
 * /delete/{id}:
 *   delete:
 *     summary: Xóa user theo ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User đã bị xóa
 */
router.delete('/delete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    let result = await ControllerUser.deleteUser(id);
    return res.status(200).json({ status: true, data: result });
  } catch (error) {
    return res.status(500).json({ status: false, data: error.message });
  }
});

router.post('/change-password', async (req, res) => {
  const { email, oldPassword, newPassword } = req.body;

  if (!email || !oldPassword || !newPassword) {
    return res.status(400).json({ errors: 'Vui lòng cung cấp đầy đủ thông tin.' });
  }

  try {
    const result = await ControllerUser.changePassword(email, oldPassword, newPassword);
    return res.status(200).json({ message: result.message });
  } catch (error) {
    return res.status(400).json({ errors: error.message });
  }
});

router.delete('/softdelete/:id', async function (req, res, next) {
  try {
    const userId = req.params.id;
    const updatedUser = await ControllerUser.removeSoftDeleted(userId);

    if (updatedUser) {
      return res.status(200).json({
        status: true,
        message: 'User successfully soft deleted',
        data: updatedUser, // Trả về thông tin đã cập nhật
      });
    } else {
      return res.status(404).json({
        status: false,
        message: 'User not found',
      });
    }
  } catch (error) {
    console.log('Delete User error:', error);
    return res.status(500).json({ status: false, error: error.message });
  }
});

router.put('/restore/available/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const updatedUser = await ControllerUser.restoreAndSetAvailable(userId);

    return res.status(200).json({
      status: true,
      message: 'User restored and set to available',
      data: updatedUser,
    });
  } catch (error) {
    console.log('Restore User error:', error);
    return res.status(500).json({ status: false, error: error.message });
  }
});

// Route gửi OTP
router.post('/send-otp', async (req, res, next) => {
  const { email } = req.body;
  try {
    let result = await ControllerUser.sendOtpToEmail(email);  // Gọi hàm sendOtpToEmail
    return res.status(200).json({ status: true, message: result });
  } catch (error) {
    console.error('Error during send OTP:', error);
    return res.status(500).json({ status: false, message: error.message });
  }
});

// Route xác thực OTP
router.post('/password/verify-otp', async (req, res, next) => {
  const { email, otp } = req.body;  // Lấy email và OTP từ body
  try {
    let result = await ControllerUser.resetPassWordverifyOtp(email, otp);  // Gọi hàm verifyOtp
    return res.status(200).json({ status: true, message: result });
  } catch (error) {
    console.error('Error during verify OTP:', error);
    return res.status(500).json({ status: false, message: error.message });
  }
});

router.post('/send-otp-sms', async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ status: false, message: 'Số điện thoại là bắt buộc.' });
  }

  try {
    const result = await ControllerUser.sendOtpToPhone(phoneNumber);
    return res.status(200).json({ status: true, message: 'OTP đã được gửi qua SMS.', data: result });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
});

router.post('/register/verify-otp', async (req, res) => {
  const { email, otp } = req.body; // Lấy email và OTP từ request body

  if (!email || !otp) {
    return res.status(400).json({ errors: 'Vui lòng cung cấp email và mã OTP.' });
  }

  try {
    const message = await ControllerUser.registerVerifyOtp(email, otp);
    return res.status(200).json({ message });
  } catch (error) {
    return res.status(400).json({ errors: error.message });
  }
});


module.exports = router;
