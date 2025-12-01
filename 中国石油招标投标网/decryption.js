const { JSEncrypt } = require('./jsencrypt.js')

function decrypt_params(data,localStorage){
    const datas = Buffer.from(JSON.stringify(data)).toString('base64')
    var encryptor = new JSEncrypt()
    encryptor.setPublicKey(localStorage.logo1)
    data = encryptor.encryptLong(JSON.stringify(datas))
    return data
}

function decrypt_result(res,localStorage){
    var encryptorJm = new JSEncrypt()
    encryptorJm.setPrivateKey(localStorage.logo2)
    var result = encryptorJm.decryptLong(res)
    const ResultData = Buffer.from(result, 'base64').toString('utf8')
    return JSON.parse(ResultData)
}
