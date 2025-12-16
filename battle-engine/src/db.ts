import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/codeduel';

if (!global.mongoose) {
  global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (global.mongoose.conn) return global.mongoose.conn;

  if (!global.mongoose.promise) {
    global.mongoose.promise = mongoose.connect(MONGO_URI).then((mongoose) => mongoose);
  }
  
  global.mongoose.conn = await global.mongoose.promise;
  return global.mongoose.conn;
}
 
declare global {
  var mongoose: { conn: any; promise: any };
}