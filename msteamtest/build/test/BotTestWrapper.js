"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const builder = require("botbuilder");
const constants = require("../src/constants");
// Helper class for getting the next message from the bot
class BotTestWrapper {
    constructor(bot) {
        this.bot = bot;
        // Waiters get the next message from a bot, and returns true if it has been fulfilled
        this.waiters = [];
        bot.on("send", (msg) => {
            this.waiters = this.waiters.filter(waiter => !waiter(msg));
        });
    }
    // Returns a promise the resolves to the next message sent by the bot whose type is specified in the filter
    getNextMessageAsync(filter = [constants.messageType]) {
        return new Promise((resolve, reject) => {
            this.waiters.push((msg) => {
                if (filter.find(type => (msg.type === type))) {
                    resolve(msg);
                    return true;
                }
                return false;
            });
        });
    }
    // Returns a promise the resolves to the next message sent by the bot whose type is specified in the filter
    // tslint:disable-next-line:typedef
    getNextMessagesAsync(count = 1, filter = [constants.messageType]) {
        return new Promise((resolve, reject) => {
            let messages = [];
            this.waiters.push((msg) => {
                if (filter.find(type => (msg.type === type))) {
                    messages.push(msg);
                    count--;
                    if (count <= 0) {
                        resolve(messages);
                        return true;
                    }
                }
                return false;
            });
        });
    }
    // Sends a message to the bot
    sendEventToBot(events) {
        this.bot.receive(events);
    }
    // Sends a text message to bot
    sendMessageToBot(line) {
        let msg = new builder.Message()
            .address({
            serviceUrl: "https://example.com/fake-service-url",
            channelId: "console",
            user: { id: "user", name: "User1" },
            bot: { id: "bot", name: "Bot" },
            conversation: { id: "Convo1" },
        })
            .sourceEvent({
            console: {
                tenant: { id: "TenantId" },
            },
        })
            .timestamp()
            .text(line);
        this.sendEventToBot(msg.toMessage());
    }
}
exports.BotTestWrapper = BotTestWrapper;

//# sourceMappingURL=BotTestWrapper.js.map
