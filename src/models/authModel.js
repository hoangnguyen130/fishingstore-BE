/* eslint-disable no-console */
import Joi from 'joi';
import { GET_DB } from '~/config/mongodb';
import { ObjectId } from 'mongodb';

const USER_COLLECTION_NAME = 'users';

const USER_COLLECTION_SCHEMA = Joi.object({
  userName: Joi.string().trim().required(),
  email: Joi.string().email().required().trim(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('user', 'admin').default('user'),
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(Date.now),
});

const check = async (query) => {
  try {
    const db = await GET_DB();
    const user = await db.collection(USER_COLLECTION_NAME).findOne(query);
    return user;
  } catch (error) {
    console.error('Error in check:', error.message, error.stack);
    throw new Error(error.message);
  }
};

const create = async (data) => {
  try {
    const db = await GET_DB();
    const { error, value } = USER_COLLECTION_SCHEMA.validate(data);
    if (error) {
      console.error('create: Validation error:', error.details);
      throw new Error(error.details[0].message);
    }

    const result = await db.collection(USER_COLLECTION_NAME).insertOne(value);
    const user = await db.collection(USER_COLLECTION_NAME).findOne({ _id: result.insertedId });
    return user;
  } catch (error) {
    console.error('Error in create:', error.message, error.stack);
    throw new Error(error.message);
  }
};

const findAll = async () => {
  try {
    const db = await GET_DB();
    const users = await db.collection(USER_COLLECTION_NAME).find({}).toArray();
    return users;
  } catch (error) {
    console.error('Error in findAll:', error.message, error.stack);
    throw new Error(error.message);
  }
};

const findById = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const db = await GET_DB();
    let user;
    
    try {
      user = await db.collection(USER_COLLECTION_NAME).findOne({ _id: new ObjectId(userId) });
    } catch (error) {
      console.error('Invalid ObjectId format:', error.message);
      throw new Error('Invalid user ID format');
    }

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    console.error('Error in findById:', error.message, error.stack);
    throw error;
  }
};

const update = async (userId, updateData) => {
  try {
    if (!userId || !/^[0-9a-fA-F]{24}$/.test(userId)) {
      throw new Error('User ID không hợp lệ');
    }

    const db = await GET_DB();
    
    // Add updatedAt timestamp
    updateData.updatedAt = new Date();

    console.log('Updating user with data:', { userId, updateData });

    // First check if user exists
    const existingUser = await db.collection(USER_COLLECTION_NAME).findOne({ _id: new ObjectId(userId) });
    if (!existingUser) {
      throw new Error('Không tìm thấy người dùng để cập nhật');
    }

    // Validate update data without _id
    const validationObject = {
      ...existingUser,
      ...updateData
    };
    delete validationObject._id; // Remove _id before validation

    const { error } = USER_COLLECTION_SCHEMA.validate(validationObject, { 
      abortEarly: false,
      stripUnknown: true // Remove fields not in schema
    });
    
    if (error) {
      console.error('Validation error:', error.details);
      throw new Error(`Dữ liệu cập nhật không hợp lệ: ${error.details[0].message}`);
    }

    // Prepare update data
    const finalUpdateData = {
      ...updateData,
      updatedAt: new Date()
    };

    console.log('Final update data:', finalUpdateData);

    // Perform the update
    const result = await db.collection(USER_COLLECTION_NAME).updateOne(
      { _id: new ObjectId(userId) },
      { $set: finalUpdateData }
    );

    console.log('Update result:', result);

    if (result.matchedCount === 0) {
      throw new Error('Không tìm thấy người dùng để cập nhật');
    }

    if (result.modifiedCount === 0) {
      console.log('No changes were made to the user');
      // Return existing user if no changes were made
      return existingUser;
    }

    // Get updated user
    const updatedUser = await db.collection(USER_COLLECTION_NAME).findOne({ _id: new ObjectId(userId) });
    if (!updatedUser) {
      throw new Error('Không thể lấy thông tin người dùng sau khi cập nhật');
    }

    console.log('Update successful:', updatedUser);
    return updatedUser;
  } catch (error) {
    console.error('Error in update:', error.message, error.stack);
    throw error;
  }
};

const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    if (!userId || !/^[0-9a-fA-F]{24}$/.test(userId)) {
      throw new Error('User ID không hợp lệ');
    }

    if (!currentPassword || !newPassword) {
      throw new Error('Mật khẩu hiện tại và mật khẩu mới là bắt buộc');
    }

    const db = await GET_DB();
    
    // Find user and verify current password
    const user = await db.collection(USER_COLLECTION_NAME).findOne({ _id: new ObjectId(userId) });
    if (!user) {
      throw new Error('Không tìm thấy người dùng');
    }

    // Here you should verify the current password matches
    // Note: In a real application, you would compare hashed passwords
    if (user.password !== currentPassword) {
      throw new Error('Mật khẩu hiện tại không đúng');
    }

    // Validate new password
    const { error } = USER_COLLECTION_SCHEMA.validate({ 
      ...user,
      password: newPassword
    }, { 
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      throw new Error(`Mật khẩu mới không hợp lệ: ${error.details[0].message}`);
    }

    // Update password
    const result = await db.collection(USER_COLLECTION_NAME).updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          password: newPassword,
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      throw new Error('Không tìm thấy người dùng để cập nhật');
    }

    return { message: 'Đổi mật khẩu thành công' };
  } catch (error) {
    console.error('Error in changePassword:', error.message, error.stack);
    throw error;
  }
};

export const authModel = {
  USER_COLLECTION_NAME,
  USER_COLLECTION_SCHEMA,
  check,
  create,
  findAll,
  findById,
  update,
  changePassword,
};