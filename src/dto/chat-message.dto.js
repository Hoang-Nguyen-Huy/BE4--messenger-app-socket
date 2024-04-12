const UserProfileDto = require('../dto/user-profile.dto');

class ChatMessageDto {
    constructor(message, timestamp, from) {
        this.message = message;
        this.timestamp = timestamp;
        this.from = new UserProfileDto(from.userid, from.name, from.avt);
    }
}

module.exports = ChatMessageDto;