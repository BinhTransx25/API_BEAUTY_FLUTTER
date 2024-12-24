const ModelUser = require("./ModelUser");
const ModelShopOwner = require("../shopowner/ModelShopOwner");
const ModelShipper = require("../shipper/ModelShipper");
const ModelShopCategory = require("../categories/ShopCategory/ModelShopCategory");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { sendMail } = require("../../helpers/Mailer");

// Hàm đăng ký người dùng hoặc shop owner
const register = async (
  name,
  email,
  password,
  phone,
  image,
  role,
  images,
  shopCategory_ids,
  address,
  latitude,
  longitude,
  verified,
  imageVerified
) => {
  try {
    // Kiểm tra email đã tồn tại trong hệ thống hay chưa
    let user = await ModelUser.findOne({ email });
    // console.log('role', role);
    console.log(
      name,
      email,
      password,
      phone,
      image,
      role,
      shopCategory_ids,
      address,
      latitude,
      longitude
    );

    if (user) {
      throw new Error("Email đã được sử dụng");
    }

    // Nếu vai trò là shopOwner, tạo một shop owner mới
    if (role === "shopOwner") {
      let shopCategories = [];
      for (const shopCategory_id of shopCategory_ids) {
        const categoryInDB = await ModelShopCategory.findById(shopCategory_id);
        if (!categoryInDB) {
          throw new Error("Category not found");
        }
        shopCategories.push({
          shopCategory_id: categoryInDB._id,
          shopCategory_name: categoryInDB.name,
        });
      }
      // Nếu không phải shop owner, tạo một người dùng thông thường
      const salt = await bcrypt.genSalt(10);
      password = await bcrypt.hash(password, salt);

      let shopOwner = new ModelShopOwner({
        name,
        email,
        password,
        phone,
        role,
        images,
        shopCategory: shopCategories, // Thêm thông tin danh mục cửa hàng cho shop owner
        address,
        latitude,
        longitude, // Sử dụng coordinates thay vì latitude và longitude riêng biệt
        verified,
        imageVerified
      });
      await shopOwner.save(); // Lưu shop owner vào cơ sở dữ liệu
    } else {
      // Nếu không phải shop owner, tạo một người dùng thông thường
      const salt = await bcrypt.genSalt(10);
      password = await bcrypt.hash(password, salt);
      user = new ModelUser({ name, email, password, phone, role });
      await user.save(); // Lưu người dùng vào cơ sở dữ liệu
    }

    return true; // Trả về true nếu đăng ký thành công
  } catch (error) {
    console.error("Lỗi trong quá trình đăng ký:", error);
    throw new Error("Lỗi khi đăng ký người dùng");
  }
};
const registerUser = async (
  name,
  email,
  password,
  phone,
  role
) => {
  let errors = null; // Biến lưu trữ lỗi
  try {
    if (!name || !email || !password || !phone || !role) {
      errors = 'Vui lòng điền đủ thông tin đăng ký.';
      return { errors };
    }

    // Kiểm tra định dạng email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      errors = 'Email không hợp lệ. Vui lòng nhập lại email.';
      return { errors };
    }

    // Kiểm tra số điện thoại có 10 chữ số
    if (!/^\d{10}$/.test(phone)) {
      errors = 'Số điện thoại phải có đúng 10 chữ số.';
      return { errors };
    }

    // Kiểm tra email đã tồn tại trong hệ thống hay chưa
    let user = await ModelUser.findOne({ email });
    console.log(name, email, password, phone, role);

    if (user) {
      errors = 'Email đã tồn tại, vui lòng nhập email khác.';
      return { errors };

    } else {
      // Tạo một người dùng mới
      const salt = await bcrypt.genSalt(10);
      password = await bcrypt.hash(password, salt);
      
      // Set thời gian hết hạn đăng ký (60 phút sau khi tạo)
      const registerExpiry = new Date(Date.now() + 60 * 60 * 1000); 

      user = new ModelUser({ name, email, password, phone, role, RegisterExpiry: registerExpiry });
      await user.save(); // Lưu người dùng vào cơ sở dữ liệu
    }

    return { status: true, message: "Bạn đã đăng ký thành công." }; // Trả về true nếu đăng ký thành công
  } catch (error) {
    console.error("Lỗi trong quá trình đăng ký:", error);
    throw new Error("Lỗi khi đăng ký người dùng");
  }
};

// Hàm xóa tài khoản hết hạn
const deleteExpiredUsers = async () => {
  const now = new Date();

  // Tìm những tài khoản có `RegisterExpiry` nhỏ hơn thời gian hiện tại
  const expiredUsers = await ModelUser.find({
    status: 'Tài khoản vừa tạo chờ xác thực OTP',
    RegisterExpiry: { $lt: now }
  });

  // Xóa những tài khoản hết hạn
  for (const user of expiredUsers) {
    await ModelUser.deleteOne({ _id: user._id });
    console.log(`Đã xóa tài khoản hết hạn: ${user.email}`);
  }

  console.log('Đã xóa các tài khoản hết hạn.');
};

// Chạy hàm xóa tài khoản hết hạn mỗi phút
const startCronJob = () => {
  setInterval(deleteExpiredUsers, 60 * 1000);  // Mỗi phút kiểm tra và xóa
};

// Đảm bảo gọi cronjob khi ứng dụng khởi động
startCronJob();

// Hàm đăng nhập người dùng hoặc shop owner
const login_user = async (identifier, password) => {
  let errors = null; // Biến lưu trữ lỗi
  try {
    // Kiểm tra nếu thiếu thông tin đăng nhập
    if (!identifier || !password) {
      errors = 'Vui lòng điền đủ thông tin đăng nhập.';
      return { errors };
    }
    // Tìm người dùng bằng email hoặc số điện thoại
    let user = await ModelUser.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
    });

    // Kiểm tra tài khoản nếu không tìm thấy trong bảng user
    if (!user) {
      errors = 'Thông tin đăng nhập không đúng, vui lòng kiểm tra lại.';
      return { errors };
    }

    // Kiểm tra trạng thái tài khoản user
    if (user.status === "Tài khoản bị khóa") {
      errors = 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.';
      return { errors };
    }
    // này thì chuyển sang màn hình otp truyền mail vào để gửi lại otp để xác thực 
    if (user.status === "Tài khoản vừa tạo chờ xác thực OTP") {
      errors = 'Tài khoản vừa tạo chờ xác thực OTP. Vui lòng xác thực OTP trước khi đăng nhập.';
      return { errors };
    }
    // Kiểm tra mật khẩu người dùng
    const checkPassword = await bcrypt.compare(password, user.password);
    if (!checkPassword) {
      errors = 'Mật khẩu không đúng, vui lòng kiểm tra lại.';
      return { errors };
    }

    // Tạo token JWT cho người dùng
    const token = jwt.sign(
      { _id: user._id, name: user.name, email: user.email, role: user.role },
      "secret",
      { expiresIn: "1h" }
    );

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      token,
    };
  } catch (error) {
    console.error("Lỗi trong quá trình đăng nhập:", error);
    throw new Error(error.message || "Lỗi khi đăng nhập người dùng");
  }
};


const loginWithSocial = async (userInfo) => {
  try {
    let userInDB = await ModelUser.findOne({ email: userInfo.email });
    let user;

    const body = {
      email: userInfo.email,
      name: userInfo.name,
      image: userInfo.photo,
      phone: userInfo.phone,
      password: "123456",
    };

    if (!userInDB) {
      // Nếu không tìm thấy trong ModelUser, kiểm tra ModelShipper
      let shipperInDB = await ModelShipper.findOne({ email: userInfo.email });
      if (!shipperInDB) {
        // Nếu không tìm thấy trong ModelShipper, kiểm tra ModelShopOwner
        let shopOwnerInDB = await ModelShopOwner.findOne({
          email: userInfo.email,
        });
        if (!shopOwnerInDB) {
          // Nếu không tìm thấy trong cả ba mô hình, tạo mới
          user = new ModelUser(body);
          await user.save();
        } else {
          // Nếu tìm thấy trong ModelShopOwner, kiểm tra trạng thái
          if (shopOwnerInDB.status === "Tài khoản bị khóa") {
            throw new Error("Tài khoản của bạn đã bị khóa");
          }
          // Nếu trạng thái hợp lệ, trả về thông tin
          return shopOwnerInDB;
        }
      } else {
        // Nếu tìm thấy trong ModelShipper, kiểm tra trạng thái
        if (shipperInDB.status === "Tài khoản bị khóa") {
          throw new Error("Tài khoản của bạn đã bị khóa");
        }
        // Nếu trạng thái hợp lệ, trả về thông tin
        return shipperInDB;
      }
    } else {
      // Nếu tìm thấy trong ModelUser, kiểm tra trạng thái
      if (userInDB.status === "Tài khoản bị khóa") {
        throw new Error("Tài khoản của bạn đã bị khóa");
      }
      // Nếu trạng thái hợp lệ, cập nhật thông tin
      user = await ModelUser.findByIdAndUpdate(userInDB._id, {
        ...userInfo,
        updatedAt: Date.now(),
      });
    }

    return user; // Trả về user từ ModelUser
  } catch (error) {
    console.log("Error during login with social:", error);
    throw new Error("Lỗi khi đăng nhập bằng tài khoản mạng xã hội");
  }
};

// chưa sử dụng 
const verifyEmail = async (email) => {
  try {
    let userInDB = await ModelUser.findOne({ email });
    if (!userInDB) {
      userInDB = await ModelShipper.findOne({ email });
      if (!userInDB) {
        userInDB = await ModelShopOwner.findOne({ email });
        if (!userInDB) {
          throw new Error("Email không tồn tại");
        }
      }
    }

    // Kiểm tra trạng thái tài khoản
    if (userInDB.status === "Tài khoản bị khóa") {
      throw new Error("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
    }

    // Tạo mã xác thực
    const verifyCode = Math.floor(1000 + Math.random() * 9000).toString();
    const data = {
      email: email,
      subject: "Mã khôi phục mật khẩu",
      content: `Mã xác thực của bạn là: ${verifyCode}`,
    };

    // Gửi email xác thực
    await sendMail(data);
    return verifyCode;
  } catch (error) {
    console.error("Error during verify email:", error);
    throw new Error(error.message || "Lỗi khi xác thực email");
  }
};

// chưa sử dụng 
// Hàm reset mật khẩu khi quênquên
const resetPassword = async (email) => {
  try {
    // Tạo mật khẩu ngẫu nhiên
    const newPassword = generateRandomPassword();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Kiểm tra tài khoản người dùng (User, Shipper, ShopOwner)
    const userInDB = await ModelUser.findOne({ email });
    if (userInDB) {
      await ModelUser.findByIdAndUpdate(userInDB._id, { password: hashedPassword });
      await sendResetPasswordEmail(email, newPassword);
      return { message: 'Mật khẩu mới đã được gửi qua email của bạn' };
    }

    throw new Error('Email không tồn tại');
  } catch (error) {
    console.log('Error during reset password:', error);
    throw new Error('Lỗi khi đặt lại mật khẩu');
  }
};

const changePassword = async (email, oldPassword, newPassword) => {
  try {
    // Tìm user theo email
    const userInDB = await ModelUser.findOne({ email });
    if (!userInDB) {
      throw new Error('Email không tồn tại');
    }

    // Kiểm tra nếu tài khoản đã được xác thực (verified: true)
    if (userInDB.verified !== true) {
      throw new Error('Tài khoản chưa được xác thực, không thể thay đổi mật khẩu');
    }

    // Kiểm tra mật khẩu cũ
    // Nếu mật khẩu đã được băm
    const checkPassword = await bcrypt.compare(oldPassword, userInDB.password);
    if (!checkPassword) {
      return { message: 'Mật khẩu cũ không đúng' };
    }

    // Băm mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    userInDB.password = await bcrypt.hash(newPassword, salt);

    // Cập nhật verified thành false sau khi thay đổi mật khẩu
    userInDB.verified = false;

    // Lưu mật khẩu mới và cập nhật trạng thái vào cơ sở dữ liệu
    await userInDB.save();

    return { message: 'Đổi mật khẩu thành công, tài khoản đã bị hủy xác thực' };
  } catch (error) {
    console.error('Error changing password:', error);
    throw new Error(error.message || 'Lỗi khi đổi mật khẩu');
  }
};


const checkUser = async (email) => {
  try {
    const userInDB = await ModelUser.findOne({ email });
    if (userInDB) {
      return true;
    }

    const shipperInDB = await ModelShipper.findOne({ email });
    if (shipperInDB) {
      return true;
    }

    const shopOwnerInDB = await ModelShopOwner.findOne({ email });
    if (shopOwnerInDB) {
      return true;
    }

    return false;
  } catch (error) {
    console.error(error);
    return false; // Hoặc xử lý lỗi theo cách bạn muốn
  }
};

// Cập nhật thông tin nhà hàng
const updateUser = async (id, name, phone, email, password, image, birthday) => {

  try {
    const userInDB = await ModelUser.findById(id);
    if (!userInDB) {
      throw new Error("Không Tìm Thấy Tài Khoản, Hãy thử lại");
    }
    userInDB.name = name || userInDB.name;
    userInDB.phone = phone || userInDB.phone;
    userInDB.email = email || userInDB.email;
    userInDB.password = password || userInDB.password;
    userInDB.image = image || userInDB.image;
    userInDB.birthday = birthday || userInDB.birthday;
    userInDB.updatedAt = Date.now();

    let result = await userInDB.save();
    return result;
  } catch (error) {
    console.error("Lỗi khi cập nhật thông tin khách hàng:", error);
    throw new Error("Lỗi khi cập nhật thông tin khách hàng");
  }
};

// Lấy thông tin tất cả các user
const getAllUsers = async () => {
  try {
    return await ModelUser.find();
  } catch (error) {
    console.error("Lỗi khi lấy thông tin tất cả các cửa hàng:", error);
    throw new Error("Lỗi khi lấy thông tin tất cả các cửa hàng");
  }
};

// Lấy thông tin user theo ID
const getUserById = async (id) => {
  try {
    const user = await ModelUser.findById(
      id,
      "name phone email address orders carts image status isDeleted verified"
    );

    if (!user) {
      throw new Error("User không tìm thấy");
    }
    return user;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin người dùng theo ID:", error);
    throw new Error("Lỗi khi lấy thông tin người dùng theo ID");
  }
};

// Xóa User
const deleteUser = async (id) => {
  try {
    return await ModelUser.findByIdAndDelete(id);
  } catch (error) {
    console.error("Lỗi khi xóa user:", error);
    throw new Error("Lỗi khi xóa user");
  }
};

// Cập nhật sản phẩm thành xóa mềm và chuyển trạng thái thành 'Tài khoản bị khóa'
const removeSoftDeleted = async (id) => {
  try {
    const userInDB = await ModelUser.findById(id);
    if (!userInDB) {
      throw new Error('User not found');
    }

    // Cập nhật trạng thái isDeleted và status
    let result = await ModelUser.findByIdAndUpdate(
      id,
      { isDeleted: true, status: 'Tài khoản bị khóa' },
      { new: true } // Trả về document đã cập nhật
    );
    return result;
  } catch (error) {
    console.log('Remove User error:', error);
    throw new Error('Remove User error');
  }
};

// Chuyển trạng thái
const restoreAndSetAvailable = async (id) => {
  try {
    const userInDB = await ModelUser.findById(id);
    if (!userInDB) {
      throw new Error('User not found');
    }

    // Cập nhật trạng thái
    const result = await ModelUser.findByIdAndUpdate(
      id,
      { isDeleted: false, status: 'Hoạt động' },
      { new: true } // Trả về document đã cập nhật
    );
    return result;
  } catch (error) {
    console.log('Restore User error:', error);
    throw new Error('Restore User error');
  }
};

// Tạo transporter để gửi email qua Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'binhtransx25@gmail.com', // Thay bằng email của bạn
    pass: 'enev uvpp mixf zlgd',  // Thay bằng mật khẩu ứng dụng Gmail của bạn
  },
});

// Hàm gửi OTP qua email
const sendOtpToEmail = async (email) => {
  try {
    // Tạo mã OTP ngẫu nhiên 4 chữ số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Lưu mã OTP và thời gian hết hạn vào cơ sở dữ liệu (giả sử bạn có ModelUser)
    const user = await ModelUser.findOne({ email });
    if (!user) {
      throw new Error('Email không tồn tại.');
    }

    // Lưu OTP và thời gian hết hạn (5 phút)
    user.otp = otp;
    user.otpExpiry = Date.now() + 1 * 60 * 1000; // Mã OTP hết hạn sau 5 phút
    await user.save();

    // Tạo nội dung email
    const mailOptions = {
      from: 'binhtransx25@gmail.com', // Địa chỉ email gửi
      to: email,                    // Địa chỉ email nhận
      subject: 'Mã OTP xác thực',    // Tiêu đề email
      text: `Mã OTP của bạn là: ${otp}. Mã này sẽ hết hạn sau 1 phút.`, // Nội dung email
    };

    // Gửi email
    await transporter.sendMail(mailOptions);
    return 'Mã OTP đã được gửi đến email của bạn.';
  } catch (error) {
    console.error('Lỗi khi gửi email:', error);
    throw new Error(error.message || 'Lỗi khi gửi mã OTP.');
  }
};
// Hàm gửi email
const sendResetPasswordEmail = async (email, newPassword) => {
  const mailOptions = {
    from: 'binhtransx25@gmail.com',
    to: email,
    subject: 'Mật khẩu mới của bạn',
    text: `Mật khẩu mới của bạn là: ${newPassword}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Đã gửi email reset mật khẩu');
  } catch (error) {
    console.error('Lỗi khi gửi email:', error);
    throw new Error('Lỗi khi gửi email');
  }
};
// Hàm xác thực OTP
const resetPassWordverifyOtp = async (email, otpInput) => {
  let errors = null; // Biến lưu trữ lỗi
  try {
    // Tìm người dùng theo email
    const user = await ModelUser.findOne({ email });
    if (!user) {
      
      errors = 'Email không tồn tại.';
      return { errors };
    }

    // Kiểm tra OTP
    if (user.otp !== otpInput) {
      errors = 'Mã OTP không đúng.';
      return { errors };
    }

    // Kiểm tra thời gian hết hạn của OTP
    if (Date.now() > user.otpExpiry) {
      errors = 'Mã OTP đã hết hạn.';
      return { errors };
    }

    // Xác thực thành công, cập nhật thông tin người dùng
    user.verified = true;
    user.otp = ''; // Xóa mã OTP
    user.otpExpiry = ''; // Xóa thời gian hết hạn OTP

    // Lưu lại thông tin người dùng
    await user.save();

    return { message:'Xác thực OTP thành công, có thể đổi mật khẩu .'};
  } catch (error) {
    console.error('Lỗi khi xác thực OTP:', error);
    throw new Error(error.message || 'Lỗi khi xác thực OTP.');
  }
};
// Hàm xác thực OTP cho đăng ký
const registerVerifyOtp = async (email, otpInput) => {
  let errors = null; // Biến lưu trữ lỗi
  try {
    // Tìm người dùng theo email
    const user = await ModelUser.findOne({ email });
    if (!user) {
      
      errors = 'Email không tồn tại.';
      return { errors };
    }

    // Kiểm tra OTP
    if (user.otp !== otpInput) {
      errors = 'Mã OTP không đúng.';
      return { errors };
    }

    // Kiểm tra thời gian hết hạn của OTP
    if (Date.now() > user.otpExpiry) {
      errors = 'Mã OTP đã hết hạn.';
      return { errors };
    }

    // Xác thực thành công, cập nhật thông tin người dùng

    user.otp = ''; // Xóa mã OTP
    user.otpExpiry = ''; // Xóa thời gian hết hạn OTP
    user.status = 'Hoạt động'; // Cập nhật trạng thái thành 'Hoạt động'
    user.RegisterExpiry = ''; // Xóa thời gian hết hạn đăng ký

    // Lưu lại thông tin người dùng
    await user.save();

    return 'Xác thực OTP và kích hoạt tài khoản thành công.';
  } catch (error) {
    console.error('Lỗi khi xác thực OTP đăng ký:', error);
    throw new Error(error.message || 'Lỗi khi xác thực OTP đăng ký.');
  }
};


// Cấu hình thông tin Twilio
// const accountSid = 'AC0aef62eb2ed3b712deda93dec5f6fb09'; // Thay bằng Account SID từ Twilio
// const authToken = 'f8d500e368e1ea5d4abccce07cdf4d27'; // Thay bằng Auth Token từ Twilio
// const client = twilio(accountSid, authToken);

// const sendOtpToPhone = async (phoneNumber) => {
//   try {
//     // Tạo mã OTP ngẫu nhiên 6 chữ số
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();

//     // Gửi tin nhắn SMS
//     const message = await client.messages.create({
//       body: `Mã OTP của bạn là: ${otp}. Mã này sẽ hết hạn sau 5 phút.`,
//       from: '+12184895663', // Thay bằng số Twilio của bạn
//       to: phoneNumber, // Số điện thoại nhận (bao gồm mã quốc gia, ví dụ: +84xxxxxxxxxx cho Việt Nam)
//     });

//     console.log('Message sent:', message.sid);
//     return { otp, messageSid: message.sid };
//   } catch (error) {
//     console.error('Lỗi khi gửi SMS:', error);
//     throw new Error('Không thể gửi OTP qua SMS.');
//   }
// };



module.exports = {
  register,
  login_user,
  loginWithSocial,
  verifyEmail,
  resetPassword,
  checkUser,
  updateUser,
  getAllUsers,
  getUserById,
  deleteUser,
  changePassword,
  removeSoftDeleted,
  restoreAndSetAvailable,
  registerUser,
  sendOtpToEmail,
  resetPassWordverifyOtp,
  deleteExpiredUsers,
  registerVerifyOtp

};
