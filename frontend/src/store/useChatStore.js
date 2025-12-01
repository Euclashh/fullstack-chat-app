import {create} from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
    messages: [],
    users: [],
    selectedUser: null,
    isUserLoading: false,
    isMessagesLoading: false,
    messagesNotRead: [],
    getUsers: async () => {
        set({isUserLoading: true});
        try {
            const res = await axiosInstance.get("messages/users");
            set({users: res.data});
        } catch (error) {
            toast.error(error.response.data.message);
        }finally{
            set({isUserLoading: false});
        }
    },

    getMessages: async (userId) => {
        set({isMessagesLoading: true});
        try {
            const res = await axiosInstance.get(`messages/${userId}`);
            set({messages: res.data});
            
        } catch (error) {
            toast.error(error);
        }finally{
            set({isMessagesLoading: false})
        }
    },

    getUnreadMessages: async (userId) => {
        
        try {
            const res = await axiosInstance.get(`/messages/unread/${userId}`);
            set({messagesNotRead: res.data});
        } catch (error) {
            toast.error(error.response.data.message);
        }
    },

    sendMessage: async (messageData) => {
        const {selectedUser, messages}= get();
        try {
            const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
            set ({messages: [...messages, res.data]});
        } catch (error) {
            toast.error(error.response.data.message)
        }
    },
    subscribeToMessages: () => {
        const { selectedUser } = get();
        if (!selectedUser) return;

        const socket = useAuthStore.getState().socket;

        socket.on("newMessage", (newMessage) => {
        const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
        if (!isMessageSentFromSelectedUser) return;

        set({
            messages: [...get().messages, newMessage],
        });
        });
    },

    unsubscribeFromMessages: ()=>{
        const socket = useAuthStore.getState().socket;

        socket.off("newMessage");
    },

    setSelectedUser: (selectedUser) => set({ selectedUser }),

    readMessages: (selectedUser)=>{
        const socket = useAuthStore.getState().socket;
        const {messagesNotRead}= get();
        socket.on("unreadUsers", (userId) => {
            console.log("id",userId)
            console.log("array",messagesNotRead)
        const index = messagesNotRead.indexOf(userId)
        console.log("index", index)
        let messagesSpliced = messagesNotRead;
        if(index!=-1) {messagesSpliced= messagesNotRead.splice(index, 1)}
        console.log("splice",messagesSpliced)
        set({
            messagesNotRead: messagesSpliced,
        });
        });
        
    }
}))