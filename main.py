from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, APIRouter
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from models import *

app = FastAPI()


app.mount("/assets", StaticFiles(directory="assets"), name="assets")

templates = Jinja2Templates(directory="templates")

manager = ConnectionManager()


@app.get("/")
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/login")
def login(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})


@ app.websocket("/ws/{client_id}/{destination}")
async def websocket_endpoint(websocket: WebSocket, client_id: str, destination: str):
    user = UserConnection(websocket, client_id)
    await manager.connect(user)
    try:
        if destination != client_id:
            for connection in manager.active_connections:
                if connection.nickname == destination:
                    while True:
                        data = await websocket.receive_text()
                        await manager.send_personal_message(f" you say: {data}", user)
                        await manager.send_personal_message(f" {client_id} say to you: {data}", connection)

    except WebSocketDisconnect:
        manager.disconnect(user)
        await manager.broadcast(f"{client_id} left the chat")
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(f"{client_id} says: {data}")
    except WebSocketDisconnect:
        manager.disconnect(user)
        await manager.broadcast(f"{client_id} left the chat")
