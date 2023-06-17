from datetime import datetime
from typing import Optional

from abc import ABCMeta, abstractmethod
from reactmindmap.databases.model.graph import DataRow, VersionInfo


class IDbConnection(metaclass=ABCMeta):

    @abstractmethod
    def pull(self) -> Optional[DataRow]:
        pass

    @abstractmethod
    def push(self, json_str: str, time: Optional[datetime]=None) -> None:
        pass

    @abstractmethod
    def get_version_info(self) -> VersionInfo:
        pass