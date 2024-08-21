"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = __importDefault(require("aws-sdk"));
aws_sdk_1.default.config.update({
    region: 'eu-west-2', // Ensure this is the region where your DynamoDB table is hosted
});
const dynamoDB = new aws_sdk_1.default.DynamoDB.DocumentClient();
exports.default = dynamoDB;
