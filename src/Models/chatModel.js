import mongoose, {Schema}from "mongoose";

const chatModel=Schema({
    chatName:{type:String},
    isGroupChat:{type:Boolean},
    users:[
        {
            type:Schema.Types.ObjectId,
            ref:"User"
        }
    ],
    latestMessage:{
        type:Schema.Types.ObjectId,
        ref:"Message"
    },
    groupAdmin:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
},
{
    timestamps:true
})

const Chat=mongoose.model("Chat",chatModel);
export default Chat;