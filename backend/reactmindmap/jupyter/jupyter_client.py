from urllib.parse import quote
import os
import requests # type: ignore
from requests import Session
from typing import Optional

class JupyterClient:

    def __init__(self, base_url: str, password: str) -> None:
        self.base_url = base_url
        self.sess = self._login_jupyter_server(password)

    def _login_jupyter_server(self, password: str) -> Session:
        sess = requests.Session()
        login_url = f"{self.base_url.rstrip('/')}/login"
        resp = sess.get(login_url)
        assert resp.status_code == 200, f"Authentication failed with status_code {resp.status_code}"
        xsrf_cookie = resp.cookies['_xsrf']
        params = {
            '_xsrf': xsrf_cookie,
            'password': password
        }
        r = sess.post(login_url, data=params)
        assert r.status_code == 200, f"Authentication failed with status_code {r.status_code}"
        sess.headers["X-XSRFToken"] = xsrf_cookie
        return sess

    def create_notebook(self, notebook_path: str, content: Optional[str]=None, file_path: Optional[str]=None) -> None:
        if content is None and file_path is None:
            raise Exception("You need to")
        elif content is not None and file_path is not None:
            raise Exception("You need to")
        elif file_path is not None:
            with open(file_path, 'r', encoding='utf8') as f:
                content = f.read()
        data = {
            'type': 'file',
            'format': 'text',
            'content': content
        }
        url = f"{self.base_url.rstrip('/')}/api/contents/{quote(notebook_path)}"
        r = self.sess.put(url, json=data)
        if not r.ok:
            raise Exception(f"Request faile with {r.status_code}. Error message {r.text}")

    def download_notebook(self, notebook_path: str, output_folder: str='.') -> None:
        params = {"type": "file", "content": 1}
        url = f"{self.base_url.rstrip('/')}/api/contents/{quote(notebook_path)}"
        r = self.sess.get(url, params=params)
        if not r.ok:
            raise Exception(f"Request faile with {r.status_code}. Error message {r.text}")

        save_path = os.path.join(output_folder, notebook_path)
        save_dir = os.path.dirname(save_path)
        if not os.path.exists(save_dir):
            os.makedirs(save_dir)

        with open(save_path, 'w', encoding='utf8') as f:
            f.write(r.json()['content'])