from app.databases.mysql.connection import MysqlConnection

CONFIG  = {
    "mysql": {
        "connectionClass": MysqlConnection,
        "connectionConfig": {
            "host":"172.17.0.4",
            "user": "root",
            "password": "12345",
            "database": "react_mindmap",
            "charset": "utf8",
            "tableName": "mindmap"
        }
    }
}