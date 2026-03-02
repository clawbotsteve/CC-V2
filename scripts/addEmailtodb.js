"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var prismadb_js_1 = require("../lib/prismadb.js");
var server_1 = require("@clerk/nextjs/server");
var p_limit_1 = require("p-limit");
var BATCH_SIZE = 100;
var MAX_CONCURRENT = 80;
function sleep(ms) {
    return new Promise(function (resolve) { return setTimeout(resolve, ms); });
}
function updateEmailsBatch() {
    return __awaiter(this, void 0, void 0, function () {
        var skip, limit, _loop_1, state_1;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    skip = 0;
                    limit = (0, p_limit_1.default)(MAX_CONCURRENT);
                    _loop_1 = function () {
                        var users, client, clerkUsers, _i, clerkUsers_1, _b, userId, email, err_1;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    console.log("Fetching user batch with skip=".concat(skip, ", take=").concat(BATCH_SIZE));
                                    return [4 /*yield*/, prismadb_js_1.default.user.findMany({
                                            skip: skip,
                                            take: BATCH_SIZE,
                                        })];
                                case 1:
                                    users = _c.sent();
                                    if (users.length === 0) {
                                        console.log('No more users to process, exiting loop.');
                                        return [2 /*return*/, "break"];
                                    }
                                    return [4 /*yield*/, (0, server_1.clerkClient)()];
                                case 2:
                                    client = _c.sent();
                                    return [4 /*yield*/, Promise.all(users.map(function (user) {
                                            return limit(function () { return __awaiter(_this, void 0, void 0, function () {
                                                var clerkUser, error_1;
                                                var _a, _b;
                                                return __generator(this, function (_c) {
                                                    switch (_c.label) {
                                                        case 0:
                                                            _c.trys.push([0, 2, , 3]);
                                                            return [4 /*yield*/, client.users.getUser(user.userId)];
                                                        case 1:
                                                            clerkUser = _c.sent();
                                                            return [2 /*return*/, {
                                                                    userId: user.userId,
                                                                    email: (_b = (_a = clerkUser.primaryEmailAddress) === null || _a === void 0 ? void 0 : _a.emailAddress) !== null && _b !== void 0 ? _b : null,
                                                                }];
                                                        case 2:
                                                            error_1 = _c.sent();
                                                            console.error("Error fetching Clerk user ".concat(user.userId, ":"), error_1);
                                                            return [2 /*return*/, { userId: user.userId, email: null }];
                                                        case 3: return [2 /*return*/];
                                                    }
                                                });
                                            }); });
                                        }))];
                                case 3:
                                    clerkUsers = _c.sent();
                                    _i = 0, clerkUsers_1 = clerkUsers;
                                    _c.label = 4;
                                case 4:
                                    if (!(_i < clerkUsers_1.length)) return [3 /*break*/, 11];
                                    _b = clerkUsers_1[_i], userId = _b.userId, email = _b.email;
                                    if (!email) return [3 /*break*/, 9];
                                    _c.label = 5;
                                case 5:
                                    _c.trys.push([5, 7, , 8]);
                                    return [4 /*yield*/, prismadb_js_1.default.user.update({
                                            where: { userId: userId },
                                            data: { email: email },
                                        })];
                                case 6:
                                    _c.sent();
                                    console.log("Updated user ".concat(userId, " with email ").concat(email));
                                    return [3 /*break*/, 8];
                                case 7:
                                    err_1 = _c.sent();
                                    console.error("Failed to update user ".concat(userId, " email:"), err_1);
                                    return [3 /*break*/, 8];
                                case 8: return [3 /*break*/, 10];
                                case 9:
                                    console.log("No email to update for user ".concat(userId));
                                    _c.label = 10;
                                case 10:
                                    _i++;
                                    return [3 /*break*/, 4];
                                case 11:
                                    skip += BATCH_SIZE;
                                    // Delay between batches to avoid flooding Clerk or DB
                                    return [4 /*yield*/, sleep(2000)];
                                case 12:
                                    // Delay between batches to avoid flooding Clerk or DB
                                    _c.sent();
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _a.label = 1;
                case 1:
                    if (!true) return [3 /*break*/, 3];
                    return [5 /*yield**/, _loop_1()];
                case 2:
                    state_1 = _a.sent();
                    if (state_1 === "break")
                        return [3 /*break*/, 3];
                    return [3 /*break*/, 1];
                case 3: return [4 /*yield*/, prismadb_js_1.default.$disconnect()];
                case 4:
                    _a.sent();
                    console.log('Finished updating emails batch.');
                    return [2 /*return*/];
            }
        });
    });
}
updateEmailsBatch()
    .catch(function (err) {
    console.error('Error updating emails:', err);
    prismadb_js_1.default.$disconnect();
});
