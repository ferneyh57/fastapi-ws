import string
from typing import List
from starlette.websockets import WebSocket


class UserConnection:
    def __init__(self, socket: WebSocket, nickname: str):
        self.socket = socket
        self.nickname = nickname


class ConnectionManager:

    def __init__(self):
        self.active_connections: List[UserConnection] = []

    # Valida si el usuario remitente ya est conectado
    def is_user_connect(self, nickname: str) -> bool:
        return nickname in map(lambda u: u.nickname, self.active_connections)

    def get_user_connection(self, nickname: str) -> UserConnection:
        conn = None
        for active_conn in self.active_connections:
            if active_conn.nickname == nickname:
                conn = active_conn

        return conn

    async def connect(self, new_connection: UserConnection):
        await new_connection.socket.accept()
        self.active_connections.append(new_connection)

    def disconnect(self, new_disconnection: UserConnection):
        self.active_connections.remove(new_disconnection)

    async def send_personal_message(self, message: str, reciber: UserConnection):
        await reciber.socket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.socket.send_text(message)
