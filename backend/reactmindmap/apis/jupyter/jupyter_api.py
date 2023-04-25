from jupyter.jupyter_client import JupyterClient
from flask import request, jsonify
from reactmindmap.apis.jupyter.template import get_template
from reactmindmap.app import app

jupyter_client = JupyterClient("http://catwang.top/jupyter", "12345")

@app.route("/api/jupyter/create_notebook", methods=["POST"])
def create_notebook():
    path = request.get_json()["path"]
    template_name = request.get_json()["template_name"]
    note_title = request.get_json().get("note_title", "Untitled")
    interpolated = get_template({"note_title": note_title}, template_name)
    try:
        jupyter_client.create_notebook(path, interpolated)
    except Exception as e:
        return jsonify({'message': 'Create failed!'}), 400
    else:
        return jsonify({'message': 'Create succeeded!'}), 200