const UserProfileDto = require('../dto/user-profile.dto');

class RealChatMessageDto {
    constructor(from, messages) {
        this.from = new UserProfileDto(from.userid, from.name, from.avt);
        this.messages = messages;
    }
}

module.exports = RealChatMessageDto;