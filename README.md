# **fastapi-ws**

Chatroom con websocket fastapi tortoise-orm.

## Clonacion de repositorio 

```
git clone https://github.com/ferneyh57/fastapi-ws.git
```

## Instalacion librerias

```
pip install -r requirements.txt
```
**Nota:** Instalar librerias que falten si sale error


## Complemento sqlite para tortoise-orm
```
pip install tortoise-orm[asyncmy]
```

## Ejecutar el proyecto
```
uvicorn main:app --reload
```

## Ingresar al chat
```
localhost:8000 | 127.0.0.1:8000
```

## USO
Al ingresar al sitio, se debera loguearse con un usuario y contraseña cualquiera.

Al lado lateral izquierdo de la aplicación salen los distintos chats disponibles.

Por defecto el chat es el global.

Al seleccionar un usuario se abre un chat con el.
