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
const request = require("request-promise");
const config = require("config");
const querystring = require("querystring");
let uuidv4 = require("uuid/v4");
const authorizationUrl = "https://accounts.google.com/o/oauth2/v2/auth";
const accessTokenUrl = "https://www.googleapis.com/oauth2/v4/token";
const callbackPath = "/auth/google/callback";
const meProfileUrl = "https://people.googleapis.com/v1/people/me";
// Example implementation of Google as an identity provider
// See https://developers.google.com/identity/protocols/OpenIDConnect
class GoogleProvider {
    constructor(clientId, clientSecret) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }
    get displayName() {
        return "Google";
    }
    // Return the url the user should navigate to to authenticate the app
    getAuthorizationUrl(state, extraParams) {
        let params = {
            response_type: "code",
            response_mode: "query",
            scope: "openid profile email",
            client_id: this.clientId,
            redirect_uri: config.get("app.baseUri") + callbackPath,
            nonce: uuidv4(),
            state: state,
        };
        if (extraParams) {
            params = Object.assign({}, extraParams, params);
        }
        return authorizationUrl + "?" + querystring.stringify(params);
    }
    // Redeem the authorization code for an access token
    getAccessTokenAsync(code) {
        return __awaiter(this, void 0, void 0, function* () {
            let params = {
                grant_type: "authorization_code",
                code: code,
                client_id: this.clientId,
                client_secret: this.clientSecret,
                redirect_uri: config.get("app.baseUri") + callbackPath,
            };
            let responseBody = yield request.post({ url: accessTokenUrl, form: params, json: true });
            return {
                accessToken: responseBody.access_token,
                expirationTime: responseBody.expires_on * 1000,
            };
        });
    }
    getProfileAsync(accessToken, personFields = ["names"]) {
        return __awaiter(this, void 0, void 0, function* () {
            let options = {
                url: `${meProfileUrl}?personFields=${personFields.join(",")}`,
                json: true,
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                },
            };
            return yield request.get(options);
        });
    }
}
exports.GoogleProvider = GoogleProvider;

//# sourceMappingURL=GoogleProvider.js.map
