"use strict";
// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License:
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED ""AS IS"", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const urlJoin = require("url-join");
const builder = require("botbuilder");
const request = require("request");
const winston = require("winston");
// Helpers for working with messages
// Creates a new Message
// Unlike the botbuilder constructor, this defaults the textFormat to "xml"
// tslint:disable-next-line:typedef
function createMessage(session, text = "", textFormat = "xml") {
    return new builder.Message(session)
        .text(text)
        .textFormat("xml");
}
exports.createMessage = createMessage;
// Get the channel id in the event
function getChannelId(event) {
    let sourceEvent = event.sourceEvent;
    if (sourceEvent && sourceEvent.channel) {
        return sourceEvent.channel.id;
    }
    return "";
}
exports.getChannelId = getChannelId;
// Get the team id in the event
function getTeamId(event) {
    let sourceEvent = event.sourceEvent;
    if (sourceEvent && sourceEvent.team) {
        return sourceEvent.team.id;
    }
    return "";
}
exports.getTeamId = getTeamId;
// Get the tenant id in the event
function getTenantId(event) {
    let sourceEvent = event.sourceEvent;
    if (sourceEvent && sourceEvent.tenant) {
        return sourceEvent.tenant.id;
    }
    return "";
}
exports.getTenantId = getTenantId;
// Returns true if this is message sent to a channel
function isChannelMessage(event) {
    return !!getChannelId(event);
}
exports.isChannelMessage = isChannelMessage;
// Returns true if this is message sent to a group (group chat or channel)
function isGroupMessage(event) {
    return event.address.conversation.isGroup || isChannelMessage(event);
}
exports.isGroupMessage = isGroupMessage;
// Strip all mentions from text
function getTextWithoutMentions(message) {
    let text = message.text;
    if (message.entities) {
        message.entities
            .filter(entity => entity.type === "mention")
            .forEach(entity => {
            text = text.replace(entity.text, "");
        });
        text = text.trim();
    }
    return text;
}
exports.getTextWithoutMentions = getTextWithoutMentions;
// Get all user mentions
function getUserMentions(message) {
    let entities = message.entities || [];
    let botMri = message.address.bot.id.toLowerCase();
    return entities.filter(entity => (entity.type === "mention") && (entity.mentioned.id.toLowerCase() !== botMri));
}
exports.getUserMentions = getUserMentions;
// Create a mention entity for the user that sent this message
function createUserMention(message) {
    let user = message.address.user;
    let text = "<at>" + user.name + "</at>";
    let entity = {
        type: "mention",
        mentioned: user,
        entity: text,
        text: text,
    };
    return entity;
}
exports.createUserMention = createUserMention;
// Gets the members of the given conversation.
// Parameters:
//      chatConnector: Chat connector instance.
//      address: Chat connector address. "serviceUrl" property is required.
//      conversationId: [optional] Conversation whose members are to be retrieved, if not specified, the id is taken from address.conversation.
// Returns: A list of conversation members.
function getConversationMembers(chatConnector, address, conversationId) {
    return __awaiter(this, void 0, void 0, function* () {
        // Build request
        conversationId = conversationId || address.conversation.id;
        let options = {
            method: "GET",
            // We use urlJoin to concatenate urls. url.resolve should not be used here,
            // since it resolves urls as hrefs are resolved, which could result in losing
            // the last fragment of the serviceUrl
            url: urlJoin(address.serviceUrl, `/v3/conversations/${conversationId}/members`),
            json: true,
        };
        let response = yield sendRequestWithAccessToken(chatConnector, options);
        if (response) {
            return response;
        }
        else {
            throw new Error("Failed to get conversation members.");
        }
    });
}
exports.getConversationMembers = getConversationMembers;
// Starts a 1:1 chat with the given user.
// Parameters:
//      chatConnector: Chat connector instance.
//      address: Chat connector address. "bot", "user" and "serviceUrl" properties are required.
//      channelData: Channel data object. "tenant" property is required.
// Returns: A copy of "address", with the "conversation" property referring to the 1:1 chat with the user.
function startConversation(chatConnector, address, channelData) {
    return __awaiter(this, void 0, void 0, function* () {
        // Build request
        let options = {
            method: "POST",
            // We use urlJoin to concatenate urls. url.resolve should not be used here,
            // since it resolves urls as hrefs are resolved, which could result in losing
            // the last fragment of the serviceUrl
            url: urlJoin(address.serviceUrl, "/v3/conversations"),
            body: {
                bot: address.bot,
                members: [address.user],
                channelData: channelData,
            },
            json: true,
        };
        let response = yield sendRequestWithAccessToken(chatConnector, options);
        if (response && response.hasOwnProperty("id")) {
            return createAddressFromResponse(address, response);
        }
        else {
            throw new Error("Failed to start conversation: no conversation ID returned.");
        }
    });
}
exports.startConversation = startConversation;
// Starts a new reply chain by posting a message to a channel.
// Parameters:
//      chatConnector: Chat connector instance.
//      message: The message to post. The address in this message is ignored, and the message is posted to the specified channel.
//      channelId: Id of the channel to post the message to.
// Returns: A copy of "message.address", with the "conversation" property referring to the new reply chain.
function startReplyChain(chatConnector, message, channelId) {
    return __awaiter(this, void 0, void 0, function* () {
        let activity = message.toMessage();
        // Build request
        let options = {
            method: "POST",
            // We use urlJoin to concatenate urls. url.resolve should not be used here,
            // since it resolves urls as hrefs are resolved, which could result in losing
            // the last fragment of the serviceUrl
            url: urlJoin(activity.address.serviceUrl, "/v3/conversations"),
            body: {
                isGroup: true,
                activity: activity,
                channelData: {
                    teamsChannelId: channelId,
                },
            },
            json: true,
        };
        let response = yield sendRequestWithAccessToken(chatConnector, options);
        if (response && response.hasOwnProperty("id")) {
            let address = createAddressFromResponse(activity.address, response);
            if (address.user) {
                delete address.user;
            }
            if (address.correlationId) {
                delete address.correlationId;
            }
            return address;
        }
        else {
            throw new Error("Failed to start reply chain: no conversation ID returned.");
        }
    });
}
exports.startReplyChain = startReplyChain;
// Send an authenticated request
function sendRequestWithAccessToken(chatConnector, options) {
    return __awaiter(this, void 0, void 0, function* () {
        // Add access token
        yield addAccessToken(chatConnector, options);
        // Execute request
        return new Promise((resolve, reject) => {
            request(options, (err, response, body) => {
                if (err) {
                    reject(err);
                }
                else {
                    if (response.statusCode < 400) {
                        try {
                            let result = typeof body === "string" ? JSON.parse(body) : body;
                            resolve(result);
                        }
                        catch (e) {
                            reject(e instanceof Error ? e : new Error(e.toString()));
                        }
                    }
                    else {
                        let txt = "Request to '" + options.url + "' failed: [" + response.statusCode + "] " + response.statusMessage;
                        reject(new Error(txt));
                    }
                }
            });
        });
    });
}
// Add access token to request options
function addAccessToken(chatConnector, options) {
    return new Promise((resolve, reject) => {
        // ChatConnector type definition doesn't include getAccessToken
        chatConnector.getAccessToken((err, token) => {
            if (err) {
                reject(err);
            }
            else {
                options.headers = {
                    "Authorization": "Bearer " + token,
                };
                resolve();
            }
        });
    });
}
// Create a copy of address with the data from the response
function createAddressFromResponse(address, response) {
    let result = Object.assign({}, address, { conversation: { id: response["id"] }, useAuth: true });
    if (result.id) {
        delete result.id;
    }
    if (response["activityId"]) {
        result.id = response["activityId"];
    }
    return result;
}
// Get locale from client info in event
function getLocale(evt) {
    let event = evt;
    if (event.entities && event.entities.length) {
        let clientInfo = event.entities.find(e => e.type && e.type === "clientInfo");
        return clientInfo.locale;
    }
    return null;
}
exports.getLocale = getLocale;
// Load a Session corresponding to the given event
function loadSessionAsync(bot, event) {
    return new Promise((resolve, reject) => {
        bot.loadSession(event.address, (err, session) => {
            if (err) {
                winston.error("Failed to load session", { error: err, address: event.address });
                reject(err);
            }
            else if (!session) {
                winston.error("Loaded null session", { address: event.address });
                reject(new Error("Failed to load session"));
            }
            else {
                let locale = getLocale(event);
                if (locale) {
                    session._locale = locale;
                    session.localizer.load(locale, (err2) => {
                        // Log errors but resolve session anyway
                        if (err2) {
                            winston.error(`Failed to load localizer for ${locale}`, err2);
                        }
                        resolve(session);
                    });
                }
                else {
                    resolve(session);
                }
            }
        });
    });
}
exports.loadSessionAsync = loadSessionAsync;

//# sourceMappingURL=MessageUtils.js.map
