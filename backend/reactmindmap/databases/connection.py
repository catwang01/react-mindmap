from typing import Optional

from reactmindmap.databases.model.graph import DataRow

class DbConnection:
    def pull(self) -> Optional[DataRow]:
        raise NotImplementedError()

    def push(self, json_str: str) -> None:
        raise NotImplementedError()