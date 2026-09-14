import mongoose,{Schema,Types} from 'mongoose';
export interface IAuditLog extends mongoose.Document {userId:Types.ObjectId;voiceTranscript:string;parsedIntent:Record<string,unknown>;status:'SUCCESS'|'FAILED'|'ROLLED_BACK';errorMessage?:string;createdAt:Date}
const S=new Schema<IAuditLog>({userId:{type:Schema.Types.ObjectId,ref:'User',required:true,index:true},voiceTranscript:{type:String,required:true,maxlength:4000},parsedIntent:{type:Schema.Types.Mixed,required:true},status:{type:String,enum:['SUCCESS','FAILED','ROLLED_BACK'],required:true},errorMessage:{type:String,maxlength:1000}},{timestamps:true});
S.index({userId:1,createdAt:-1});
export default (mongoose.models.AuditLog as mongoose.Model<IAuditLog>) || mongoose.model<IAuditLog>('AuditLog',S);
