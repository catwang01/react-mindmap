from typing import Optional

class DbConnection:
    def pull(self) -> Optional[dict]:
        raise NotImplementedError()

    def push(self, json: str) -> None:
        raise NotImplementedError()