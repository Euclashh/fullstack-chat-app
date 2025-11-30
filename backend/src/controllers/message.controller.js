import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUserForSidebar = async(req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find({_id: {$ne: loggedInUserId}}).select("-password");
        res.status(200).json(filteredUsers)
    } catch (error) {
        console.error("Error in getUsersForSidebar: ",error.message)
        res.status(500).json({error: "Internal server error"});
    }
};

export const getUnreadMessages = async(req, res) => {
    try {   
        const myId = req.user._id;
        
        const messages = await Message.find({
            $or: [
                {receiverId: myId, read: false},
            ],
        });
        let senders= [];

        messages.forEach((mess)=>{
            if(senders.includes(mess.senderId.toString())){ return };
            senders= [...senders, mess.senderId.toString()]
            
        });

        res.status(200).json(senders)
    } catch (error) {
        console.error("Error in getUnreadMessages controller: ",error.message);
        res.status(500).json({error: "Internal server error"});
    }
};

export const getMessages = async(req, res) => {
    try {
        const {id: userToChatId} = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                {senderId: myId, receiverId:userToChatId},
                {senderId: userToChatId, receiverId: myId},
            ],
        });

        await Message.find({
            $or: [
                {senderId: userToChatId, receiverId: myId, read:false}
            ],
        }).updateMany({ read: true });;
        io.emit("unreadUsers", userToChatId);
        res.status(200).json(messages)
    } catch (error) {
        console.error("Error in getMessages controller: ",error.message);
        res.status(500).json({error: "Internal server error"});
    }
};

export const sendMessage = async(req, res) => {
    try {
        const {text, image, read} = req.body;
        const {id: receiverId} = req.params;
        const senderId = req.user._id;


        let imageUrl;
        if(image) {
            //Upload base64 image to cloudinary
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }
        
        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl,
            read,
        });
        console.log(newMessage)
        await newMessage.save();
        //realtime functionality goes here => socket.io
        const ReceiverSocketId = getReceiverSocketId(receiverId);
        if(ReceiverSocketId){
            io.to(ReceiverSocketId).emit("newMessage", newMessage);
        }
        
        res.status(201).json(newMessage)
    } catch (error) {
        console.error("Error in sendMessage: ",error.message)
        res.status(500).json({error: "Internal server error"});
    }
};
export const readMessages= (req, res)=>{

};