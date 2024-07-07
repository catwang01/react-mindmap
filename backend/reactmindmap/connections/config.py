from reactmindmap.databases.mysql.connection import MysqlConnection
import os

CONFIG  = {
    "mysql": {
        "connectionClass": MysqlConnection,
        "connectionConfig": {
            "host": os.environ.get("DB_CONNECTION_NAME", "mysql"),
            "port": 3306,
            "user": "root",
            "password": "12345",
            "database": "react_mindmap",
            "charset": "utf8",
            "tableName": "mindmap"
        }
    }
}
