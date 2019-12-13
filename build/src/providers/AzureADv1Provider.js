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
// =========================================================
// AzureAD v1 API
// =========================================================
const authorizationUrl = "https://login.microsoftonline.com/common/oauth2/authorize";
const accessTokenUrl = "https://login.microsoftonline.com/common/oauth2/token";
const callbackPath = "/auth/azureADv1/callback";
const graphProfileUrl = "https://graph.microsoft.com/v1.0/me";
// Example implementation of AzureAD as an identity provider
// See https://docs.microsoft.com/en-us/azure/active-directory/develop/active-directory-protocols-oauth-code
class AzureADv1Provider {
    constructor(clientId, clientSecret) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }
    get displayName() {
        return "Azure AD";
    }
    // Return the url the user should navigate to to authenticate the app
    getAuthorizationUrl(state, extraParams) {
        let params = {
            response_type: "code",
            response_mode: "query",
            client_id: this.clientId,
            redirect_uri: config.get("app.baseUri") + callbackPath,
            resource: "https://graph.microsoft.com",
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
                resource: "https://graph.microsoft.com",
            };
            let responseBody = yield request.post({ url: accessTokenUrl, form: params, json: true });
            return {
                accessToken: responseBody.access_token,
                expirationTime: responseBody.expires_on * 1000,
            };
        });
    }
    getProfileAsync(accessToken) {
        return __awaiter(this, void 0, void 0, function* () {
            let options = {
                url: graphProfileUrl,
                json: true,
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                },
            };
            return yield request.get(options);
        });
    }
}
exports.AzureADv1Provider = AzureADv1Provider;

//# sourceMappingURL=AzureADv1Provider.js.map
