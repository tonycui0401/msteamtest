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
const constants = require("../constants");
const LinkedInDialog_1 = require("./LinkedInDialog");
const AzureADv1Dialog_1 = require("./AzureADv1Dialog");
const GoogleDialog_1 = require("./GoogleDialog");
// Root dialog provides choices in identity providers
class RootDialog extends builder.IntentDialog {
    constructor() {
        super();
    }
    // Register the dialog with the bot
    register(bot) {
        bot.dialog(constants.DialogId.Root, this);
        this.onBegin((session, args, next) => { this.onDialogBegin(session, args, next); });
        this.onDefault((session) => { this.onMessageReceived(session); });
        new LinkedInDialog_1.LinkedInDialog().register(bot, this);
        new AzureADv1Dialog_1.AzureADv1Dialog().register(bot, this);
        new GoogleDialog_1.GoogleDialog().register(bot, this);
        this.matches(/linkedIn/i, constants.DialogId.LinkedIn);
        this.matches(/azureADv1/i, constants.DialogId.AzureADv1);
        this.matches(/google/i, constants.DialogId.Google);
    }
    // Handle resumption of dialog
    dialogResumed(session, result) {
        this.promptForIdentityProvider(session);
    }
    // Handle start of dialog
    onDialogBegin(session, args, next) {
        return __awaiter(this, void 0, void 0, function* () {
            session.dialogData.isFirstTurn = true;
            this.promptForIdentityProvider(session);
            next();
        });
    }
    // Handle message
    onMessageReceived(session) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!session.dialogData.isFirstTurn) {
                // Unrecognized input
                session.send("I didn't understand that.");
                this.promptForIdentityProvider(session);
            }
            else {
                delete session.dialogData.isFirstTurn;
            }
        });
    }
    // Prompt the user to pick an identity provider
    promptForIdentityProvider(session) {
        let msg = new builder.Message(session)
            .addAttachment(new builder.ThumbnailCard(session)
            .title("Select an identity provider")
            .buttons([
            builder.CardAction.imBack(session, "LinkedIn", "LinkedIn"),
            builder.CardAction.messageBack(session, "{}", "AzureAD (v1)")
                .displayText("AzureAD (v1)")
                .text("AzureADv1"),
            builder.CardAction.imBack(session, "Google", "Google"),
        ]));
        session.send(msg);
    }
}
exports.RootDialog = RootDialog;

//# sourceMappingURL=RootDialog.js.map
