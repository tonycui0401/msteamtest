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
const builder = require("botbuilder");
const config = require("config");
const utils = require("../utils");
let uuidv4 = require("uuid/v4");
// Base identity dialog
class BaseIdentityDialog extends builder.IntentDialog {
    constructor(providerName, dialogId) {
        super();
        this.providerName = providerName;
        this.dialogId = dialogId;
    }
    // Register the dialog with the bot
    register(bot, rootDialog) {
        bot.dialog(this.dialogId, this);
        this.authProvider = bot.get(this.providerName);
        this.providerDisplayName = this.authProvider.displayName;
        this.onBegin((session, args, next) => { this.onDialogBegin(session, args, next); });
        this.onDefault((session) => { this.onMessageReceived(session); });
        this.matches(/SignIn/, (session) => { this.handleLogin(session); });
        this.matches(/ShowProfile/, (session) => { this.showUserProfile(session); });
        this.matches(/SignOut/, (session) => { this.handleLogout(session); });
        this.matches(/Back/, (session) => { session.endDialog(); });
    }
    // Get the validated user token, if we have one
    getUserToken(session) {
        return utils.getUserToken(session, this.providerName);
    }
    // Show prompt of options
    promptForAction(session) {
        return __awaiter(this, void 0, void 0, function* () {
            let msg = new builder.Message(session)
                .addAttachment(new builder.ThumbnailCard(session)
                .title(this.providerDisplayName)
                .buttons([
                builder.CardAction.messageBack(session, "{}", "Sign in")
                    .text("SignIn")
                    .displayText("Sign in"),
                builder.CardAction.messageBack(session, "{}", "Show profile")
                    .text("ShowProfile")
                    .displayText("Show profile"),
                builder.CardAction.messageBack(session, "{}", "Sign out")
                    .text("SignOut")
                    .displayText("Sign out"),
                builder.CardAction.messageBack(session, "{}", "Back")
                    .text("Back")
                    .displayText("Back"),
            ]));
            session.send(msg);
        });
    }
    // Handle start of dialog
    onDialogBegin(session, args, next) {
        return __awaiter(this, void 0, void 0, function* () {
            session.dialogData.isFirstTurn = true;
            this.showUserProfile(session);
            next();
        });
    }
    // Handle message
    onMessageReceived(session) {
        return __awaiter(this, void 0, void 0, function* () {
            let messageAsAny = session.message;
            if (messageAsAny.originalInvoke) {
                // This was originally an invoke message, see if it is signin/verifyState
                let event = messageAsAny.originalInvoke;
                if (event.name === "signin/verifyState") {
                    yield this.handleLoginCallback(session);
                }
                else {
                    console.warn(`Received unrecognized invoke "${event.name}"`);
                }
            }
            else {
                // See if we are waiting for a verification code and got one
                if (utils.isUserTokenPendingVerification(session, this.providerName)) {
                    let verificationCode = utils.findVerificationCode(session.message.text);
                    utils.validateVerificationCode(session, this.providerName, verificationCode);
                    // End of auth flow: if the token is marked as validated, then the user is logged in
                    if (utils.getUserToken(session, this.providerName)) {
                        yield this.showUserProfile(session);
                    }
                    else {
                        session.send(`Sorry, there was an error signing in to ${this.providerDisplayName}. Please try again.`);
                    }
                }
                else {
                    // Unrecognized input
                    session.send("I didn't understand. Please select an option below.");
                    this.promptForAction(session);
                }
            }
        });
    }
    // Handle user login callback
    handleLoginCallback(session) {
        return __awaiter(this, void 0, void 0, function* () {
            let messageAsAny = session.message;
            let verificationCode = messageAsAny.originalInvoke.value.state;
            utils.validateVerificationCode(session, this.providerName, verificationCode);
            // End of auth flow: if the token is marked as validated, then the user is logged in
            if (utils.getUserToken(session, this.providerName)) {
                yield this.showUserProfile(session);
            }
            else {
                session.send(`Sorry, there was an error signing in to ${this.providerDisplayName}. Please try again.`);
            }
        });
    }
    // Handle user logout request
    handleLogout(session) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!utils.getUserToken(session, this.providerName)) {
                session.send(`You're already signed out of ${this.providerDisplayName}.`);
            }
            else {
                utils.setUserToken(session, this.providerName, null);
                session.send(`You're now signed out of ${this.providerDisplayName}.`);
            }
            yield this.promptForAction(session);
        });
    }
    // Handle user login request
    handleLogin(session) {
        return __awaiter(this, void 0, void 0, function* () {
            if (utils.getUserToken(session, this.providerName)) {
                session.send(`You're already signed in to ${this.providerDisplayName}.`);
                yield this.promptForAction(session);
            }
            else {
                // Create the OAuth state, including a random anti-forgery state token
                let state = JSON.stringify({
                    securityToken: uuidv4(),
                    address: session.message.address,
                });
                utils.setOAuthState(session, this.providerName, state);
                // Create the authorization URL
                let authUrl = this.authProvider.getAuthorizationUrl(state);
                // Build the sign-in url
                let signinUrl = config.get("app.baseUri") + `/html/auth-start.html?authorizationUrl=${encodeURIComponent(authUrl)}`;
                // The fallbackUrl specifies the page to be opened on mobile, until they support automatically passing the
                // verification code via notifySuccess(). If you want to support only this protocol, then you can give the
                // URL of an error page that directs the user to sign in using the desktop app. The flow demonstrated here
                // gracefully falls back to asking the user to enter the verification code manually, so we use the same
                // signin URL as the fallback URL.
                let signinUrlWithFallback = signinUrl + `&fallbackUrl=${encodeURIComponent(signinUrl)}`;
                // Send card with signin action
                let msg = new builder.Message(session)
                    .addAttachment(new builder.HeroCard(session)
                    .text(`Click below to sign in to ${this.providerDisplayName}`)
                    .buttons([
                    new builder.CardAction(session)
                        .type("signin")
                        .value(signinUrlWithFallback)
                        .title("Sign in"),
                ]));
                session.send(msg);
                // The auth flow resumes when we handle the identity provider's OAuth callback in AuthBot.handleOAuthCallback()
            }
        });
    }
}
exports.BaseIdentityDialog = BaseIdentityDialog;

//# sourceMappingURL=BaseIdentityDialog.js.map
