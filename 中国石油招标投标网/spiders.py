import execjs
import requests
import re
import time
from fake_useragent import UserAgent
from pprint import pp, pprint
import ddddocr
import re
import json
import sys
import os
class Spider(object):
    def __init__(self):
        self.ctx = None
        self.project_type_map= {
            "全部": "",
            "物资": "0001",
            "工程": "0002",
            "服务": "0001",
        }
        self.ocr = ddddocr.DdddOcr(show_ad=False)
    def get_random_headers(self):
        """生成带有随机 User-Agent 的请求头"""
        return {
            "Content-Type": "application/json;charset=UTF-8",
            "MACHINE_CODE": str(int(time.time() * 1000)),
            "User-Agent": UserAgent().random,

        }

    def get_local_storage(self,headers=None):
        url = "https://www.cnpcbidding.com/cms/css/bj.css"
        response = requests.get(url, headers=headers)
        result_ls = response.text.split('.')
        regex = r'base64,([^)]+)\)'
        c1 = re.search(regex, result_ls[1])
        c2 = re.search(regex, result_ls[2])

        localStorage={
            "logo2": c2.group(1),
            "logo1": c1.group(1),
            "time": headers['MACHINE_CODE']
        }
        return localStorage
    
    def read_js_code(self,file_path='decryption.js'):
        # 1. 编写或读取 JS 代码字符串
        # 如果文件路径不是绝对路径，尝试从脚本所在目录查找
        if not os.path.isabs(file_path):
            script_dir = os.path.dirname(os.path.abspath(__file__))
            file_path = os.path.join(script_dir, file_path)
        with open(file_path, 'r', encoding='utf-8') as f:
            js_code = f.read()
        return execjs.compile(js_code)


    def get_encrypt_data(self,request_params:dict=None,headers=None,localStorage=None):
        data={
            "current": request_params['page'],
            "size": 10,
            "condition": {
                "columnId": "4",# 公开招标中标候选人公示
                "title": request_params['title'],# 搜索关键字
                "projectType": request_params['project_type'],#项目类型
            }
        }
        decrypt_params = self.ctx.call("decrypt_params", data,localStorage)

        request_url= "https://www.cnpcbidding.com/cms/article/page"
        response = requests.post(request_url, headers=headers, data=decrypt_params)
        return response

    def get_captcha(self,headers=None):
        qr_img_url = "https://www.cnpcbidding.com/cms/validateCode/undefined"
        response = requests.get(qr_img_url, headers=headers)
        img_data=response.json()['data']
        return img_data
    
    def get_captcha_result(self,ocr_qr_result):
        # 先去除空白字符和等号后的内容
        expr = ocr_qr_result.replace(' ', '').replace('＝', '=')
        expr = re.sub(r'=.*', '', expr)  # 去除等号及后面内容

        # 统一常见的算术符号
        expr = expr.replace('＋', '+').replace('t', '+').replace('T', '+')
        expr = expr.replace('x', '*').replace('X', '*').replace('×', '*')
        expr = expr.replace('÷', '/').replace('·', '*')

        # 移除除数字和运算符外的其他字符
        expr = re.sub(r'[^0-9\+\-\*/]', '', expr)
        return eval(expr)

    def verify_captcha(self,captcha_result,headers=None):
        yz_url=f'https://www.cnpcbidding.com/cms/validateCode/{captcha_result}'
        response = requests.get(yz_url, headers=headers)
        qr_response_data = response.json()
        if qr_response_data['message'] == "请求成功":
            return qr_response_data

    def loop_handle_captcha(self,headers=None):
        loop_num = 10
        while True:
            # 获取验证码base64信息
            img_data = self.get_captcha(headers)
            # 调用ddddocr识别验证码
            ocr_qr_result = self.ocr.classification(img_data)
            # 去除验证码不干净数据，计算验证码结果
            captcha_result = self.get_captcha_result(ocr_qr_result)
            # 发起请求，验证验证码是否正确
            verify_flag = self.verify_captcha(captcha_result,headers)
            if verify_flag:
                return verify_flag
            else:
                loop_num = loop_num - 1

        

    def run(self,request_params:dict=None):
        headers = self.get_random_headers()
        localStorage = self.get_local_storage(headers)
        self.ctx = self.read_js_code()
        encrypt_data_response = self.get_encrypt_data(request_params,headers,localStorage)
        if '"code":"511"' in encrypt_data_response.text:
            verify_flag = self.loop_handle_captcha(headers)
            if verify_flag:
                encrypt_data_response = self.get_encrypt_data(request_params,headers,localStorage)
                decrypt_result = self.ctx.call("decrypt_result", encrypt_data_response.text,localStorage)
                return decrypt_result
        else:
            decrypt_result = self.ctx.call("decrypt_result", encrypt_data_response.text,localStorage)
            return decrypt_result



        






if __name__ == "__main__":
    import sys
    import json
    
    # 如果提供了命令行参数（JSON 格式），则使用它
    if len(sys.argv) > 1:
        try:
            # 从命令行参数中解析 JSON
            params_json = sys.argv[1]
            request_params = json.loads(params_json)
        except json.JSONDecodeError as e:
            # 如果 JSON 解析失败，使用默认参数
            print(json.dumps({"error": f"JSON 解析失败: {e}"}), file=sys.stderr)
            sys.exit(1)
    else:
        # 如果没有提供参数，使用默认值
        request_params = {
            'page': 1,
            'title': "",
            'project_type': ""
        }

    try:
        spider = Spider()
        result = spider.run(request_params)
        # 将结果以 JSON 格式输出
        if isinstance(result, dict):
            print(json.dumps(result, ensure_ascii=False))
        else:
            print(json.dumps({"result": str(result)}, ensure_ascii=False))
    except Exception as e:
        # 如果执行出错，返回错误信息
        error_result = {
            "error": str(e),
            "type": type(e).__name__
        }
        print(json.dumps(error_result, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)
   