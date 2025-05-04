/* eslint-disable no-console */
import Joi from 'joi';
import { GET_DB } from '~/config/mongodb';

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

export const authModel = {
  USER_COLLECTION_NAME,
  USER_COLLECTION_SCHEMA,
  check,
  create,
  findAll,
};