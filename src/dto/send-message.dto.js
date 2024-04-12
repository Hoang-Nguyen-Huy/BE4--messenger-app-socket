class SendMessageDto {
    constructor(message, accessToken) {
        this.message = message;
        this.accessToken = accessToken;
    }
}

module.exports = SendMessageDto;