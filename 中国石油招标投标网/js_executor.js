#!/usr/bin/env node

// Node.js 包装脚本，用于执行 JavaScript 函数
const { JSEncrypt } = require('./jsencrypt.js');
const { decrypt_params, decrypt_result } = require('./decryption.js');

// 从命令行参数读取
const args = process.argv.slice(2);
if (args.length < 2) {
    console.error(JSON.stringify({error: "参数不足"}));
    process.exit(1);
}

const functionName = args[0];
const inputData = JSON.parse(args[1]);

let result;
try {
    if (functionName === 'decrypt_params') {
        result = decrypt_params(inputData.data, inputData.localStorage);
    } else if (functionName === 'decrypt_result') {
        result = decrypt_result(inputData.res, inputData.localStorage);
    } else {
        throw new Error(`未知函数: ${functionName}`);
    }
    console.log(JSON.stringify(result));
} catch (error) {
    console.error(JSON.stringify({error: error.message, type: error.constructor.name}));
    process.exit(1);
}

