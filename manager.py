"""
Manages active connections and data caching
"""
import asyncio
from typing import Dict

from fastapi import WebSocket


class UserCache:
    """
    Stores user data and websocket for active connections
    """
    def __init__(self):
        self.active_users: Dict[str, dict] = {}

    def new_user(self, user_id: str, new_data: dict, connection: WebSocket):
        """
        Brand new user opens a connection.
        """
        self.active_users[user_id] = {"data": new_data, "connection": connection}

    def update_user_data(self, user_id: str, new_data: dict):
        self.active_users[user_id]["data"] = new_data

    def update_user_connection(self, user_id: str, connection: WebSocket):
        """
        When user is already cached but opens a new connection.
        """
        self.active_users[user_id]["connection"] = connection

    def remove_user(self, user_id: str):
        del self.active_users[user_id]

    def get_user_data(self, user_id: str):
        return self.active_users.get(user_id)

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    async def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
