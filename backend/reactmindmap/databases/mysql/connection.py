import hashlib
from datetime import datetime
from typing import Optional

import pymysql
from pymysql.cursors import DictCursor
from reactmindmap.databases.connection import DbConnection
from reactmindmap.databases.exceptions import CannotGetDataException
from reactmindmap.databases.model.graph import DataRow, VersionInfo


# generate a md5 hash function
def md5(s: str) -> str:
    block = hashlib.md5()
    block.update(s.encode("utf-8"))
    return block.hexdigest()


class MysqlConnection(DbConnection):
    def __init__(self, config: dict) -> None:
        self.connectionConfig = {}
        self.otherParams = {}
        connectionConfigKeys = {
            "host",
            "user",
            "password",
            "database",
            "charset",
            "port",
        }
        for k, v in config.items():
            if k in connectionConfigKeys:
                self.connectionConfig[k] = v
            else:
                self.otherParams[k] = v
        self.connection = pymysql.connect(**self.connectionConfig)

    def pull(self) -> Optional[DataRow]:
        with self.connection.cursor(DictCursor) as cursor:
            sql = f"SELECT * FROM {self.otherParams['tableName']} ORDER BY time DESC LIMIT 1"
            cursor.execute(sql)
            row = cursor.fetchone()
            if row is None:
                return None
        return DataRow(**row)

    def push(self, json_str: str) -> None:
        sql = f"INSERT INTO {self.otherParams['tableName']}(time, json) VALUES(%s, %s)"
        with self.connection.cursor() as cursor:
            cursor.executemany(sql, [(datetime.now(), json_str)])
            self.connection.commit()

    def get_version_info(self) -> VersionInfo:
        data = self.pull()
        if data is None:
            raise CannotGetDataException("Can't get data")
        version_str = md5(data.json)
        return VersionInfo(version_str, data.time)