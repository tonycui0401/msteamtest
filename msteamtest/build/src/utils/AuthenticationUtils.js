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
const randomNumber = require("random-number-csprng");
// How many digits the verification code should be
const verificationCodeLength = 6;
// How long the verification code is valid
const verificationCodeValidityInMilliseconds = 10 * 60 * 1000; // 10 minutes
// Regexp to look for verification code in message
const verificationCodeRegExp = /\b\d{6}\b/;
// Gets the OAuth state for the given provider
function getOAuthState(session, providerName) {
    ensureProviderData(session, providerName);
    return (session.userData[providerName].oauthState);
}
exports.getOAuthState = getOAuthState;
// Sets the OAuth state for the given provider
function setOAuthState(session, providerName, state) {
    ensureProviderData(session, providerName);
    let data = session.userData[providerName];
    data.oauthState = state;
    session.save().sendBatch();
}
exports.setOAuthState = setOAuthState;
// Ensure that data bag for the given provider exists
function ensureProviderData(session, providerName) {
    if (!session.userData[providerName]) {
        session.userData[providerName] = {};
    }
}
exports.ensureProviderData = ensureProviderData;
// Gets the validated user token for the given provider
function getUserToken(session, providerName) {
    let token = getUserTokenUnsafe(session, providerName);
    return (token && token.verificationCodeValidated) ? token : null;
}
exports.getUserToken = getUserToken;
// Checks if the user has a token that is pending verification
function isUserTokenPendingVerification(session, providerName) {
    let token = getUserTokenUnsafe(session, providerName);
    return !!(token && !token.verificationCodeValidated && token.verificationCode);
}
exports.isUserTokenPendingVerification = isUserTokenPendingVerification;
// Sets the user token for the given provider
function setUserToken(session, providerName, token) {
    ensureProviderData(session, providerName);
    let data = session.userData[providerName];
    data.userToken = token;
    session.save().sendBatch();
}
exports.setUserToken = setUserToken;
// Prepares a token for verification. The token is marked as unverified, and a new verification code is generated.
function prepareTokenForVerification(userToken) {
    return __awaiter(this, void 0, void 0, function* () {
        userToken.verificationCodeValidated = false;
        userToken.verificationCode = yield generateVerificationCode();
        userToken.verificationCodeExpirationTime = Date.now() + verificationCodeValidityInMilliseconds;
    });
}
exports.prepareTokenForVerification = prepareTokenForVerification;
// Finds a verification code in the text string
function findVerificationCode(text) {
    let match = verificationCodeRegExp.exec(text);
    return match && match[0];
}
exports.findVerificationCode = findVerificationCode;
// Validates the received verification code against what is expected
// If they match, the token is marked as validated and can be used by the bot. Otherwise, the token is removed.
function validateVerificationCode(session, providerName, verificationCode) {
    let tokenUnsafe = getUserTokenUnsafe(session, providerName);
    if (!tokenUnsafe.verificationCodeValidated) {
        if (verificationCode &&
            (tokenUnsafe.verificationCode === verificationCode) &&
            (tokenUnsafe.verificationCodeExpirationTime > Date.now())) {
            tokenUnsafe.verificationCodeValidated = true;
        }
        else {
            console.warn("Verification code does not match.");
            setUserToken(session, providerName, null);
        }
        // Save the token information back to userData
        setUserToken(session, providerName, tokenUnsafe);
    }
    else {
        console.warn("Received unexpected login callback.");
    }
}
exports.validateVerificationCode = validateVerificationCode;
// Generate a verification code that the user has to enter to verify that the person that
// went through the authorization flow is the same one as the user in the chat.
function generateVerificationCode() {
    return __awaiter(this, void 0, void 0, function* () {
        let verificationCode = yield randomNumber(0, Math.pow(10, verificationCodeLength) - 1);
        return ("0".repeat(verificationCodeLength) + verificationCode).substr(-verificationCodeLength);
    });
}
// Gets the user token for the given provider, even if it has not yet been validated
function getUserTokenUnsafe(session, providerName) {
    ensureProviderData(session, providerName);
    return (session.userData[providerName].userToken);
}

//# sourceMappingURL=AuthenticationUtils.js.map
