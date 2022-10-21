from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from tortoise.contrib.fastapi import HTTPNotFoundError, register_tortoise
from models.users import User_Pydantic, UserIn_Pydantic, Users
from models.messages import Message_Pydantic, MessageIn_Pydantic, Messages
from models.models import UserConnection, ConnectionManager
from tortoise.functions import Max
from tortoise.expressions import Q
from datetime import datetime

import json
import time
import calendar


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["POST, GET"],
    allow_headers=["*"],
)

app.mount("/assets", StaticFiles(directory="assets"), name="assets")

templates = Jinja2Templates(directory="templates")

manager = ConnectionManager()

# VIEWS


@app.get("/")
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/login")
def login(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

# HTTP GET REQUESTS


@app.get("/users", response_model=List[User_Pydantic])
async def get_users():
    return await User_Pydantic.from_queryset(Users.all())


@app.get("/user/{origin}", response_model=List[User_Pydantic])
async def get_user(origin: str):
    return await User_Pydantic.from_queryset(Users.filter(nickname=origin))


@app.get("/messages/{origin}/{destination}")
async def get_messages(origin: str, destination: str):
    return await Message_Pydantic.from_queryset(Messages.filter(Q(sender=origin) and Q(receiver=destination)))


@app.get("/global", response_model=List[Message_Pydantic])
async def chat_global():
    return await Message_Pydantic.from_queryset(Messages.filter(receiver="global"))

# HTTP POST REQUESTS


@app.post("/register", response_model=UserIn_Pydantic)
async def create_user(user: UserIn_Pydantic):
    new_user = user.dict(exclude_unset=True)

    registered_users = await Users.filter(nickname=new_user["nickname"])

    print(len(registered_users))
    if len(registered_users) > 0:
        new_user.update({"status": True})
        print("El usuario ya esta registrado")
        return new_user

    last_id = [{"id": 1}]

    try:
        last_id = await Users.annotate(max=Max("id")).group_by("id").values("id")
        print("El ultimo id de usuarios es: {}".format(last_id[-1]["id"]))
        new_user.update({"id": last_id[-1]["id"] + 1})
    except:
        new_user.update({"id": 1})
        print("Error al realizar consulta a la base de datos")

    user_obj = await Users.create(**new_user)

    return await User_Pydantic.from_tortoise_orm(user_obj)

# WEBSOCKET


@app.websocket("/ws/{origin}")
async def websocket_endpoint(websocket: WebSocket, origin: str):
    message_config = {
        # receptor del mensaje
        "receiver": "global",

        # Mensaje a enviar al receptor
        "message": "...",

        # Fecha creacion del mensaje
        "date": 0,

        # Datos de usuario del emisor
        "user": {
            "id": 0,
            "nickname": "...",
            "status": "...",
        }
    }

    data_user = await Users.filter(nickname=origin).first()

    # Si el usuario emisor no tiene conexion activa, entonces se crea una nueva
    user = UserConnection(websocket, origin)

    time_stamp = datetime.now().timestamp()
    await manager.connect(user)

    message_config["user"]["id"] = data_user.id
    message_config["user"]["nickname"] = data_user.nickname
    message_config["user"]["status"] = data_user.status
    message_config["date"] = time_stamp

    try:
        message_config["message"] = f"new: {origin}"
        # Se le notifica a los demas usuario que se unio alguien nuevo a la sala de chat
        str_message_config = json.dumps(message_config)
        await manager.broadcast(str_message_config)
    except WebSocketDisconnect:
        await data_user.update_from_dict({"status": False})
        message_config["user"]["status"] = False
        message_config["message"] = f"{origin} left the chat"
        str_message_config = json.dumps(message_config)
        manager.disconnect(user)
        await manager.broadcast(str_message_config)

    try:
        while True:
            data = await websocket.receive_text()
            data_dict = json.loads(data)
            message_config["message"] = data_dict["message"]
            str_message_config = json.dumps(message_config)

            time_stamp = datetime.now().timestamp()
            last_id = await the_last_id_messages()
            new_message = {
                "id": last_id+1,
                "message": data_dict["message"],
                "sender": origin,
                "receiver": data_dict["receiver"],
                "date": time_stamp
            }
            await Messages.create(**new_message)

            if data_dict["receiver"] == "global":
                await manager.broadcast(str_message_config)
            else:

                # Si el usuario emisor no tiene conexion activa, entonces se crea una nueva
                try:
                    user_receiver = UserConnection(websocket, origin)

                    await manager.connect(user_receiver)
                    await manager.send_personal_message(
                        str_message_config,
                        user_receiver,
                    )
                except:
                    print("El usuario destino, no esta conectado")

    except WebSocketDisconnect:
        await data_user.update_from_dict({"status": False})
        message_config["user"]["status"] = False
        message_config["message"] = f"{origin} left the chat"
        str_message_config = json.dumps(message_config)
        manager.disconnect(user)
        await manager.broadcast(str_message_config)


async def the_last_id_messages():
    try:
        last_id = await Messages.annotate(max=Max("id")).group_by("id").values("id")
        return last_id[-1]["id"]
    except:
        return 1


# CONFIG DB
db_config = {
    'connections': {
        'default': 'sqlite://chatsito.sqlite3',
    },
    'apps': {
        'models': {
            'models': ['models.users', 'models.messages'],
            # If no default_connection specified, defaults to 'default'
            'default_connection': 'default',
        }
    }
}

# BUILD DATA BASE
register_tortoise(
    app,
    modules={"models": ["models"]},
    config=db_config,
    generate_schemas=True,
    add_exception_handlers=True,
)
