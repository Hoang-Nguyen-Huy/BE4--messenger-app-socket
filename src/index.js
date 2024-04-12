const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const { createAdapter, setupPrimary } = require('@socket.io/cluster-adapter');
const axios = require('axios');
const crypto = require('crypto');
const UserProfileDto = require('./dto/user-profile.dto');
const SendMessageDto = require('./dto/send-message.dto');
const RealChatMessageDto = require('./dto/real-chat-message.dto');
const ChatMessageDto = require('./dto/chat-message.dto');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_URL = 'http://localhost:3000';

async function getProfile(accessToken) {
    try {
        const response = await axios.get(`${API_URL}/auth/profile`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        return response.data; // Trả về dữ liệu profile từ response
    } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error; // Ném lỗi để xử lý bên ngoài
    }
}

async function loadChatData() {
    try {
        const chatData = await prisma.chatMessage.findMany();
        return chatData;
    } catch(error) {
        console.error('Error loading chat data:  ', error);
        throw error;
    }
}

async function insertChatData(data) {
    //Generate a random UUID (v4)
    const uuid = crypto.randomUUID();

    //Hash the UUID with MD5
    const md5hash = crypto.createHash('md5').update(uuid).digest('hex');

    //Use md5hash as the userid in newUser
    data.id = md5hash;
    try {
        const newChatMessage = await prisma.chatMessage.create({
            data: {
                id: data.id,
                message: data.message,
                timestamp: new Date(),
                user: {
                    connectOrCreate: {
                        where: { userid: data.from.id},
                        create: {
                            userid: data.from.id,
                            name: data.from.name,
                            avt: data.from.avt
                        }
                    }
                }
            }
        });

        console.log('Inserted new chat message:', newChatMessage);
        return newChatMessage;
    } catch (error) {
        console.error('Error inserting chat message: ', error);
        throw error;
    }
}

async function findUserById(userid) {
    try {
        const user = await prisma.user.findUnique({
            where: {
                userid: userid
            }
        });

        return user; // Trả về thông tin người dùng nếu tìm thấy
    } catch (error) {
        console.error('Error finding user by id:', error);
        throw error;
    }
}


async function getRealChatData() {
    try {
        const chatData = await loadChatData();

        // Nếu chatData không tồn tại hoặc rỗng, trả về mảng rỗng
        if (!chatData || chatData.length === 0) {
            return [];
        }

        let realChatData = [];

        // Đảo ngược mảng chatData để xử lý từ tin nhắn mới nhất
        for (let i = chatData.length - 1; i >= 0; i--) {
            const message = chatData[i];

            // Lấy thông tin người dùng từ userid
            const user = await findUserById(message.userid);
            if (!user) {
                console.error(`User not found for userid: ${message.userid}`);
                continue; // Bỏ qua nếu không tìm thấy người dùng
            }

            const { message: chatMessage, timestamp } = message;

            // Tìm vị trí của người gửi trong realChatData (nếu có)
            const existingSenderIndex = realChatData.findIndex((item) => item.id === user.userid);

            if (existingSenderIndex !== -1) {
                // Nếu người gửi đã tồn tại, thêm tin nhắn vào đầu mảng messages của người đó
                realChatData[existingSenderIndex].messages.unshift(new ChatMessageDto(chatMessage, timestamp, user));
            } else {
                // Nếu người gửi chưa tồn tại, tạo một entry mới trong realChatData
                realChatData.unshift(new RealChatMessageDto(user, [new ChatMessageDto(chatMessage, timestamp, user)]));
            }
        }
        return realChatData;
    } catch(error) {
        console.error('Error getting real chat data: ', error);
        throw error;
    }
}


const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: "*"
    }
});

io.on("connection", (socket) => {
    console.log("A client connected");

    // Gửi dữ liệu chat hiện tại đến client mới kết nối
    socket.emit("UPDATE_CHAT", getRealChatData());

    // Xử lý sự kiện khi client ngắt kết nối
    socket.on("disconnect", (reason) => {
        console.log("A client disconnected");
    });

    // Xử lý sự kiện khi server nhận được tin nhắn từ client
    socket.on("SEND_MESSAGE", async (dto) => {
        try {
            // Lấy thông tin profile từ API với accessToken
            const profile = await getProfile(dto.accessToken);

            if (profile) {
                // Thêm tin nhắn mới vào cơ sở dữ liệu
                await insertChatData({
                    message: dto.message,
                    from: profile,
                });

                // Gửi sự kiện UPDATE_CHAT tới tất cả các client để cập nhật dữ liệu chat
                io.emit("UPDATE_CHAT", await getRealChatData());
            } else {
                console.log("Failed to fetch user profile.");
            }
        } catch (error) {
            console.error("Error handling SEND_MESSAGE:", error);
        }
    });
});

loadChatData();
// Khởi động server HTTP để lắng nghe các kết nối từ client
httpServer.listen(9000, () => {
    console.log("Server started!");
});
