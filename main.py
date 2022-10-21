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
import json


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
async def get_user(origin: int):
    return await User_Pydantic.from_queryset(Users.filter(id=origin))


@app.get("/messages/{origin}/{destination}")
async def get_users(origin: int, destination: int):
    return await Message_Pydantic.from_queryset(Messages.filter(Q(id_sender=origin) and Q(id_receiver=destination)))


@app.get("/global", response_model=List[Message_Pydantic])
async def chat_global():
    return await Message_Pydantic.from_queryset(Messages.filter(id_receiver=0))

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
    except:
        print("Error al realizar consulta a la base de datos")

    new_user.update({"id": last_id[-1]["id"] + 1})
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
    await manager.connect(user)

    message_config["user"]["id"] = data_user.id
    message_config["user"]["nickname"] = data_user.nickname
    message_config["user"]["status"] = data_user.status

    try:
        message_config["message"] = f"new: {origin}"
        # Se le notifica a los demas usuario que se unio alguien nuevo a la sala de chat
        str_message_config = json.dumps(message_config)
        await manager.broadcast(str_message_config)
    except WebSocketDisconnect:
        manager.disconnect(user)
        message_config["message"] = f"{origin} left the chat"
        str_message_config = json.dumps(message_config)
        await manager.broadcast(str_message_config)

    try:
        while True:
            data = await websocket.receive_text()
            data_dict = json.loads(data)
            message_config["message"] = data_dict["message"]
            str_message_config = json.dumps(message_config)

            if data_dict["receiver"] == "global":
                print(data_dict["message"])
                # user_obj = await Messages.create(**{})

                await manager.broadcast(str_message_config)
            else:
                user_receiver = manager.get_user_connection(
                    data_dict["receiver"],
                )
                manager.send_personal_message(
                    str_message_config,
                    user_receiver,
                )
    except WebSocketDisconnect:
        manager.disconnect(user)
        message_config["message"] = f"{origin} left the chat"
        str_message_config = json.dumps(message_config)
        await manager.broadcast(str_message_config)

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
