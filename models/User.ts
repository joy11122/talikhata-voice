import mongoose,{Schema,Types} from 'mongoose';
export interface IUser extends mongoose.Document{_id:Types.ObjectId;name:string;email:string;password?:string;image?:string;shopId?:Types.ObjectId;createdAt:Date}
const S=new Schema<IUser>({name:{type:String,required:true,trim:true,maxlength:120},email:{type:String,required:true,unique:true,index:true,lowercase:true,trim:true},password:{type:String,select:false},image:{type:String},shopId:{type:Schema.Types.ObjectId,ref:'Shop'},createdAt:{type:Date,default:Date.now}},{versionKey:false});
const User=(mongoose.models.User as mongoose.Model<IUser>)||mongoose.model<IUser>('User',S);export default User;
