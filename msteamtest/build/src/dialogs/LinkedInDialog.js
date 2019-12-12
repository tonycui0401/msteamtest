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
const BaseIdentityDialog_1 = require("./BaseIdentityDialog");
// Dialog that handles dialogs for LinkedIn provider
class LinkedInDialog extends BaseIdentityDialog_1.BaseIdentityDialog {
    constructor() {
        super(constants.IdentityProviders.linkedIn, constants.DialogId.LinkedIn);
    }
    // Show user profile
    showUserProfile(session) {
        return __awaiter(this, void 0, void 0, function* () {
            let linkedInApi = this.authProvider;
            let userToken = this.getUserToken(session);
            if (userToken) {
                let profile = yield linkedInApi.getProfileAsync(userToken.accessToken, ["formatted-name", "headline", "picture-url", "public-profile-url", "location", "num-connections", "num-connections-capped"]);
                let profileCard = new builder.ThumbnailCard()
                    .title(profile.formattedName)
                    .subtitle(profile.headline)
                    .text(`${profile.location.name} • ${profile.numConnections}${profile.numConnectionsCapped ? "+" : ""} connections`)
                    .buttons([
                    builder.CardAction.openUrl(session, profile.publicProfileUrl, "View on LinkedIn"),
                ])
                    .images([
                    new builder.CardImage()
                        .url(profile.pictureUrl)
                        .alt(profile.formattedName),
                ]);
                session.send(new builder.Message().addAttachment(profileCard));
            }
            else {
                session.send("Please sign in to LinkedIn so I can access your profile.");
            }
            yield this.promptForAction(session);
        });
    }
}
exports.LinkedInDialog = LinkedInDialog;

//# sourceMappingURL=LinkedInDialog.js.map
