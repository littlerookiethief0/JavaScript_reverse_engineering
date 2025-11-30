import execjs
import requests
import re
import time
from fake_useragent import UserAgent

# 初始化 UserAgent 对象
ua = UserAgent()
print(ua.random)
def get_random_headers():
    """生成带有随机 User-Agent 的请求头"""
    return {
        "Content-Type": "application/json;charset=UTF-8",
        "MACHINE_CODE": "null",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",

    }

time_stamp = str(int(time.time() * 1000))
headers = get_random_headers()

def get_local_storage(headers=None):
    """获取 localStorage，使用传入的 headers 或生成新的随机 headers"""
    if headers is None:
        headers = get_random_headers()
    url = "https://www.cnpcbidding.com/cms/css/bj.css"
    response = requests.get(url, headers=headers)

    result_ls = response.text.split('.')

    css1 = result_ls[1] if len(result_ls) > 1 else ''
    css2 = result_ls[2] if len(result_ls) > 2 else ''

    regex = r'base64,([^)]+)\)'

    c1 = re.search(regex, css1)
    c2 = re.search(regex, css2)

    localStorage={
        "logo2": c2.group(1),
        "logo1": c1.group(1),
        "time": time_stamp
    }
    return localStorage

localStorage = get_local_storage()

# 1. 编写或读取 JS 代码字符串
with open('decryption.js', 'r') as f:
    js_code = f.read()

# 2. 编译 JS
ctx = execjs.compile(js_code)

for i in range(1, 155):

    # 每次请求都生成新的随机 User-Agent
    headers = get_random_headers()
    time_stamp = str(int(time.time() * 1000))
    headers["MACHINE_CODE"] = time_stamp

    data={
        "current": i,
        "size": 10,
        "condition": {
            "columnId": "4",
            "title": "",
            "projectType": ""
        }
    }


    # 使用当前的 headers 获取 localStorage（保持 User-Agent 一致）
    localStorage = get_local_storage(headers)
    # 3. 调用 JS 函数
    decrypt_params = ctx.call("decrypt_params", data,localStorage)

    url = "https://www.cnpcbidding.com/cms/article/page"

    response = requests.post(url, headers=headers, data=decrypt_params)
    # print(response.text)
    if '"code":"511"' in response.text:
        qr_img_url = "https://www.cnpcbidding.com/cms/validateCode/undefined"
        response = requests.get(qr_img_url, headers=headers)
        img_data=response.json()['data']

        qr_url='http://api.jfbym.com/api/YmServer/customApi'
        qr_data={
        "token": "b-SkqpN3hVoR2syRpa2T_qlcMaFx559kIt3Axyxj158",
        "type": "50100",
        "image": img_data,
    }
        response = requests.post(qr_url, headers=headers, json=qr_data)
        resutl_jisuan=response.json()['data']['data']

        yz_url=f'https://www.cnpcbidding.com/cms/validateCode/{resutl_jisuan}'
        response = requests.get(yz_url, headers=headers)
        js_code = response.json()
        print(js_code)
    
        response = requests.post(url, headers=headers, data=decrypt_params)
        try:
            decrypt_result = ctx.call("decrypt_result", response.text,localStorage)
            print(decrypt_result['data']['current'])
        except Exception as e:
            print('解析失败','第',i,'页')
        continue
    response = requests.post(url, headers=headers, data=decrypt_params)
    decrypt_result = ctx.call("decrypt_result", response.text,localStorage)
    print(decrypt_result['data']['current'],decrypt_result)



