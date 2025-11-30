const { JSEncrypt } = require('./jsencrypt.js')

// var data={
//     "current": 2,
//     "size": 10,
//     "condition": {
//         "columnId": "4",
//         "title": "",
//         "projectType": ""
//     }
// }
// const datas = Buffer.from(JSON.stringify(data)).toString('base64')
// const localStorage={
//     "logo2": "MIICdwIBADANBgkqhkiG9w0BAQEFAASCAmEwggJdAgEAAoGBAJj8JCLCtGj+fPBwm7m8iWQUDWrq5760edZjs00ApubrTdLQhLkHVbJv22AQ3Ntmhufwl//qvLs27cp8pCpau9fqzJc1XI5mkaYq3zg7PQ5u5p7bBchE6P5fmi+R2uMmojpR8X6zA1hJTS5ZsE0bou8Re6sWjnqV5u2hJeXPbScxAgMBAAECgYA+cONa4Ld8Byr9hCi7VY2KMHkNg5VVDBqSe50KN9Lne3EHM56IWssKiocynY9XaXB0qImRpcCkdRX3SIpE00XJh74BqPLaj07CNnq4gRnvO0v40/QvG9U1PVsmxDt47GOm+t9Kfs6EPMgMP2Wyw7sJ9sEpcN7YGSXosPXnrhKmsQJBANm9d510ifwwsBufwywwnmlid82r5dghYYJEdhW2/rx0+sRzFXrW3jBZ2Pu5+12/H7wDqkL9eUM7CY3wKbOj1A0CQQCz3dAGa8TPDBrFAD6dO4pH2NmPmGN0HgObiMWsi5YrBoDngFTGqJOZkKlt+8+qaATfeTUNVLigOILXKzOACKK1AkEAm5TSH2PiJJz1eQeTAcRLrKl7SS6GsQRJFDeu2J1FL4u2kyBYPMnDQXExpcyiW73xAvrrcaqENxG8JftxELcDEQJAfQD8cWn2ltrXw/A+k/HsUbCQy25iODIf2bl9gERmsjJL5hhXUtWX9xMF3Y0zL0ApmtJXH5Ow2JFNxZKdsS7PPQJBANWuhzmTm9NkeCqRNBQ/PMeAaPZuhs/+NB4j4bmVm6TY+iRowecZ+bmbD+vWr0JcBo3Cllhbloz39qz7TfORhok= ",
//     "logo1": "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCI7UP802rorCeicqPg+F81psNnQ8Gslx4cIAiRWHlaK5w3iraC2UURhgyFwEXO+/Q443SxgLmWY1NrLej7JmiOnILgO+nxOI/qhPMbTDSJSeyRSqt55dzJItKhymTYhCkdKxxmjBE/LKlxS7e57wSIjA1uy4WUDb4VFq2SXfTrrwIDAQAB ",
//     "time": "1764397446805"
// }


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
    const ele = JSON.parse(ResultData)
    return ele
}
