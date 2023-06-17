from typing import cast

from flask import request
from reactmindmap.app import app
from reactmindmap.connections.factory import DbConnectionFactory
from reactmindmap.utils.type_utils import nn


@app.route('/api/db/<dbconnectionName>/pull')
def pull(dbconnectionName: str):
    try:
        connection = DbConnectionFactory.getDbConnectionFactory(dbconnectionName)
        json = connection.pull()
    except Exception as e:
        return { "error": "Error while operationing on database", 
                 "message": f"Not finished due to {e}" }, 403
    return { 'data': json }, 200

@app.route('/api/db/<dbconnectionName>/push', methods=['POST'])
def push(dbconnectionName: str):
    try:
        connection = DbConnectionFactory.getDbConnectionFactory(dbconnectionName)
        jsonData = request.json
        if 'json' not in nn(jsonData):
            return {
                "error": "Miss parameter", 
                "message": f"Please pass a json parameter: {jsonData}" 
            }, 403
        json = cast(dict, jsonData).get('json')
        connection.push(json)
    except Exception as e:
        return { "error": "Can't push to database", "message": f"Not finished due to message: {e}" }, 403
    return { "message": "Insertion finished" }, 200