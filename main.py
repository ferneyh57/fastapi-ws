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


app = FastAPI()

# origins = [
#     "http://localhost:8080",
# ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST, GET"],
    allow_headers=["*"],
)

app.mount("/assets", StaticFiles(directory="assets"), name="assets")

templates = Jinja2Templates(directory="templates")

manager = ConnectionManager()


@app.get("/")
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/users", response_model=List[User_Pydantic])
async def get_users():
    return await User_Pydantic.from_queryset(Users.all())


@app.post("/login", response_model=UserIn_Pydantic)
async def create_user(user: UserIn_Pydantic):
    print(user)
    # print(await User_Pydantic.from_queryset(Users.all()))
    user_obj = await Users.create(**user.dict(exclude_unset=True))
    # websocket = WebSocket
    # user = UserConnection(websocket, user_obj.nickname)
    # await manager.connect(user)
    # await manager.broadcast("user:{}".format(user.nickname))

    return await User_Pydantic.from_tortoise_orm(user_obj)


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

db_config = {
    'connections': {
        # Dict format for connection
        'default': {
            'engine': 'tortoise.backends.asyncpg',
            'credentials': {
                'host': 'db.bit.io',
                'port': '5432',
                'user': 'contruto',
                'password': 'v2_3ur6z_nDEFhrNUVbT5PG6SEEB2ewn',
                'database': 'contrutos/db-contruto',
            }
        },
        # Using a DB_URL string
        # 'default': 'postgresql://contruto:v2_3ur6z_nDEFhrNUVbT5PG6SEEB2ewn@db.bit.io/contrutos/db-contruto'
    },
    'apps': {
        'models': {
            'models': ['models.users', 'models.messages'],
            # If no default_connection specified, defaults to 'default'
            'default_connection': 'default',
        }
    }
}

register_tortoise(
    app,
    modules={"models": ["models"]},
    config=db_config,
    generate_schemas=True,
    add_exception_handlers=True,
)
