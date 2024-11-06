import { MongoClient, ServerApiVersion } from 'mongodb'
import { env } from './environment'


let petshopDBInstance = null

const MongoClientInstance = new MongoClient(env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
})

export const CONNECT_DB = async () => {
  await MongoClientInstance.connect()

  petshopDBInstance = MongoClientInstance.db(env.DATABASE_NAME)
}

export const CLOSE_DB = async () => {
  await MongoClientInstance.close()
}

export const GET_DB = () => {
  if (!petshopDBInstance) throw new Error('Must connect to DB first!')
  return petshopDBInstance
}
