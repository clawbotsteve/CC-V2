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
var p_limit_1 = require("p-limit");
var prismadb_js_1 = require("../lib/prismadb.js");
var server_1 = require("@clerk/nextjs/server");
var BATCH_SIZE = 100;
var MAX_CONCURRENT = 80;
function sleep(ms) {
    return new Promise(function (resolve) { return setTimeout(resolve, ms); });
}
function syncUsersWithSubscriptionsBatch() {
    return __awaiter(this, void 0, void 0, function () {
        var skip, totalInserted, limit, _loop_1, state_1;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    skip = 0;
                    totalInserted = 0;
                    limit = (0, p_limit_1.default)(MAX_CONCURRENT);
                    _loop_1 = function () {
                        var subUsersBatch, batchUserIds, existingUsers, existingUserIds, missingUserIds, client, promises, newUsersData;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    console.log("Fetching UserSubscription batch with skip=".concat(skip, ", take=").concat(BATCH_SIZE));
                                    return [4 /*yield*/, prismadb_js_1.default.userSubscription.findMany({
                                            skip: skip,
                                            take: BATCH_SIZE,
                                            select: { userId: true },
                                        })];
                                case 1:
                                    subUsersBatch = _b.sent();
                                    if (subUsersBatch.length === 0) {
                                        console.log('No more UserSubscription records to process, exiting loop.');
                                        return [2 /*return*/, "break"];
                                    }
                                    batchUserIds = subUsersBatch.map(function (u) { return u.userId; });
                                    return [4 /*yield*/, prismadb_js_1.default.user.findMany({
                                            where: { userId: { in: batchUserIds } },
                                            select: { userId: true },
                                        })];
                                case 2:
                                    existingUsers = _b.sent();
                                    existingUserIds = new Set(existingUsers.map(function (u) { return u.userId; }));
                                    missingUserIds = batchUserIds.filter(function (id) { return !existingUserIds.has(id); });
                                    if (missingUserIds.length === 0) {
                                        console.log("No missing users in batch at offset ".concat(skip, ", skipping to next batch."));
                                        skip += BATCH_SIZE;
                                        return [2 /*return*/, "continue"];
                                    }
                                    return [4 /*yield*/, (0, server_1.clerkClient)()];
                                case 3:
                                    client = _b.sent();
                                    promises = missingUserIds.map(function (userId) {
                                        return limit(function () { return __awaiter(_this, void 0, void 0, function () {
                                            var clerkUser, firstName, lastName, name_1, imageUrl, error_1;
                                            var _a, _b, _c;
                                            return __generator(this, function (_d) {
                                                switch (_d.label) {
                                                    case 0:
                                                        _d.trys.push([0, 2, , 3]);
                                                        return [4 /*yield*/, client.users.getUser(userId)];
                                                    case 1:
                                                        clerkUser = _d.sent();
                                                        firstName = (_a = clerkUser.firstName) !== null && _a !== void 0 ? _a : '';
                                                        lastName = (_b = clerkUser.lastName) !== null && _b !== void 0 ? _b : '';
                                                        name_1 = "".concat(firstName, " ").concat(lastName).trim();
                                                        imageUrl = (_c = clerkUser.imageUrl) !== null && _c !== void 0 ? _c : '';
                                                        console.log("Fetched Clerk user: ".concat(userId, ", name: \"").concat(name_1, "\""));
                                                        return [2 /*return*/, { userId: userId, name: name_1, imageUrl: imageUrl, referralCode: '' }];
                                                    case 2:
                                                        error_1 = _d.sent();
                                                        console.error("Failed to fetch Clerk user ".concat(userId, ":"), error_1);
                                                        return [2 /*return*/, { userId: userId, name: '', imageUrl: '', referralCode: '' }];
                                                    case 3: return [2 /*return*/];
                                                }
                                            });
                                        }); });
                                    });
                                    return [4 /*yield*/, Promise.all(promises)];
                                case 4:
                                    newUsersData = _b.sent();
                                    console.log("Inserting ".concat(newUsersData.length, " new users into DB..."));
                                    return [4 /*yield*/, prismadb_js_1.default.user.createMany({
                                            data: newUsersData,
                                            skipDuplicates: true,
                                        })];
                                case 5:
                                    _b.sent();
                                    totalInserted += newUsersData.length;
                                    console.log("Inserted ".concat(newUsersData.length, " users in batch at offset ").concat(skip));
                                    skip += BATCH_SIZE;
                                    // Optional delay between batches
                                    return [4 /*yield*/, sleep(2000)];
                                case 6:
                                    // Optional delay between batches
                                    _b.sent();
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
                case 3:
                    console.log("Sync completed. Total new users inserted: ".concat(totalInserted));
                    return [2 /*return*/];
            }
        });
    });
}
syncUsersWithSubscriptionsBatch()
    .catch(console.error)
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prismadb_js_1.default.$disconnect()];
            case 1:
                _a.sent();
                console.log('Disconnected from database.');
                return [2 /*return*/];
        }
    });
}); });
