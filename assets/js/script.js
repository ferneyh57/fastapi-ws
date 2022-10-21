var ws

const DOMAIN = window.origin, /// Nombre del dominio de sitio web
  USERS = `${DOMAIN}/users`, /// Ruta para obtener los usuarios registrados
  USER = `${DOMAIN}/users`, /// Ruta para obtener algun usurio registrado
  NEWUSER = `${DOMAIN}/register`,/// Ruta registrar a un usuario
  MESSAGES = `${DOMAIN}/messages`, /// Ruta para obtener los mensajes de algun chat
  CHATGLOBAL = `${DOMAIN}/global`, /// Ruta para obtener los globales del chat

  /// Opciones para definir que hacer desde el socker
  SEND = "send",
  GLOBAL = "global";

/// Configuracion del mensaje que se va a tener para la comunicacion con el socket
var message_config = {
  // receptor del mensaje
  receiver: "global",

  // Mensaje a enviar al receptor
  message: "...",

  // Datos de usuario del emisor
  user: {
    id: 0,
    nickname: "...",
    status: "...",
  }
}

async function ajax(props) {
  let { url, method, csrf, entry, cbSuccess } = props;

  await fetch(url, {
    method: method ?? "GET",
    credentials: "include",
    body: JSON.stringify(entry),
    cache: "no-cache",
    headers: new Headers({
      "Content-Type": "application/json",
      //"X-CSRF-TOKEN": csrf ?? ""
    })
  })
    .then(res => res.ok ? res.json() : Promise.reject(res))
    .then(async json => await cbSuccess(json))
    .catch(err => {
      let message = err.statusText || "Ocurrio un error al acceder al servidor";
      //   document.getElementById("products").innerHTML = `
      // <div class="bg-red-500 text-white font-bold text-2xl text-center h-40 flex justify-center items-center flex-col">
      // <div >${err.status} (${message})</div>
      // <div >${err}</div>
      // </div>`;
      //   document.querySelector('.loader').style.display = "none";
      console.log(err);
    })
}

/// Dialogo de autenticacion de usuario
async function showAuthDialog() {
  const { value: formValues } = await Swal.fire({
    title: 'Ingresar',
    html:
      '<input id="swal-input1" class="swal2-input">' +
      '<input id="swal-input2" class="swal2-input">',
    showCancelButton: false,
    confirmButtonText: 'ingresar',
    showLoaderOnConfirm: true,
    preConfirm: async () => {
      let nickname = document.getElementById('swal-input1').value
      let password = document.getElementById('swal-input2').value
      if (nickname != "" && password != "") {
        let body = { id: 1, nickname: nickname, password: password, status: true }

        let response

        await ajax({
          url: NEWUSER,
          method: "POST",
          entry: body,
          cbSuccess: (value) => { response = value }
        })
        return response
      }
      return Swal.showValidationMessage(
        `Informacion incorrecta`
      )
    },
    allowOutsideClick: () => Swal.isLoading()
  })

  return formValues

}

function buildMessage(message) {
  //// MENSAJES GLOBALES
  /// Contenido html para los mensajes. 
  /// En esta variable se obtiene la etiqueta html que muestra los mensajes.
  let $contentForAllMessage = document.getElementById('messages')

  /// MENSAJE A MOSTRAR
  let $contentForMessages = document.createElement('div')
  /// Contenido html para el mensaje a mostrar.
  /// En esta variable se guardara la etiqueta <p>Aqui va el mensaje recibido</p>, 
  let $contentForMessage = document.createElement('div')
  /// Contenido html para el texto del mensaje a mostrar.
  /// En esta se introduce el mensaje recibido.
  let $contentForMesssageText = document.createElement('p')
  /// Texto del mensaje recibido.
  var contentText = document.createTextNode(message)

  /// CREACION DE LA FECHA Y HORA EN LA QUE SE RECIBIO EL MENSAJE.
  /// Contenido html para la fecha y hora en la que se recibe el mensaje.
  let $contentForTimeText = document.createElement('p')
  let currentDate = new Date();
  /// Texto de la fecha actual con formato YYYY/MM/DD
  let cDate = currentDate.getFullYear() + '/' + (currentDate.getMonth() + 1) + '/' + currentDate.getDay()
  /// Texto de la hora actual con formato HH:MM
  let contentTimeText = document.createTextNode(currentDate.getHours() + ":" + currentDate.getMinutes() + " | " + cDate)

  /// CREACION DE ESTILOS CSS CON BOTSTRAP
  /// Asignacion de clases para el estilo del contenido del mensaje
  $contentForMessages.classList.add("media-body")
  $contentForMessage.classList.add("bg-light", "rounded", "py-2", "px-3", "mb-2")
  /// Asignacion de clases para el estilo del contenido del texto del mensaje
  $contentForMesssageText.classList.add("text-small", "mb-0", "text-muted")
  /// Asignacion de clases para el estilo del contenido de la fecha y hora
  $contentForTimeText.classList.add("small", "text-muted")

  /// AGREGACION DEL MENSAJE RECIBIDO DENTRO DE LOS MENSAJES
  $contentForMesssageText.appendChild(contentText)
  $contentForMessage.appendChild($contentForMesssageText)
  $contentForTimeText.appendChild(contentTimeText)
  $contentForMessages.appendChild($contentForMessage)
  $contentForMessages.appendChild($contentForTimeText)
  $contentForAllMessage.appendChild($contentForMessages)
}

function buildUser(nickname, subtitle, id_sender, id_receiver) {
  return `<a onclick="builPersonalChat(${id_sender}, ${id_receiver})" class="list-group-item list-group-item-action active text-white rounded-0">
    <div class="media"><img src="https://bootstrapious.com/i/snippets/sn-chat/avatar.svg" alt="user"
      width="50" class="rounded-circle">
      <div class="media-body ml-4">
        <div class="d-flex align-items-center justify-content-between mb-1">
          <h6 class="mb-0">${nickname}</h6><small id="${nickname}-status" class="small font-weight-bold">online</small>
        </div>
        <p class="font-italic mb-0 text-small">${subtitle}</p>
      </div>
    </div>
  </a>`;
}

async function getUsers() {
  var users
  await ajax({
    url: USERS,
    cbSuccess: async (response_users) => {
      users = response_users
    }
  });
  return users
}

async function getUser(id_user) {
  var user
  await ajax({
    url: `${USER}/${id_user}`,
    cbSuccess: async (response_user) => {
      user = response_user
    }
  });
  return user
}

async function getChatGlobal() {
  var chat_global
  await ajax({
    url: CHATGLOBAL,
    cbSuccess: async (reponse_chat_global) => {
      chat_global = reponse_chat_global
    }
  });
  return chat_global
}

async function getChatPersonal(id_sender, id_receiver) {
  var chat_personal
  await ajax({
    url: `${MESSAGES}/${id_sender}/${id_receiver}`,
    cbSuccess: async (reponse_chat_global) => {
      chat_personal = reponse_chat_global
    }
  });
  return chat_personal
}

async function builPersonalChat(id_sender, id_receiver) {
  let chat_personal = await getChatPersonal(id_sender, id_receiver)
  console.log(chat_personal)
}


(async function () {
  let nicknameLocalStorage = localStorage.getItem("nickname")
  let idLocalStorage = localStorage.getItem("id")
  let id = 0
  let nickname = ""

  if (nicknameLocalStorage == "" || nicknameLocalStorage == null || idLocalStorage == null) {
    login = await showAuthDialog()
    id = login.id
    nickname = login.nickname

    await Swal.fire({
      title: `Bienvenido ${nickname}`,
    })

    localStorage.setItem("nickname", nickname)
    document.querySelector("#ws-id").textContent = nickname
  } else {
    id = idLocalStorage
    nickname = nicknameLocalStorage
    document.querySelector("#ws-id").textContent = nicknameLocalStorage
  }
  console.log("Antes del ajax")
  let users = await getUsers()
  console.log(users)
  let $list_users = document.getElementById("list-users")
  $list_users.innerHTML = ""

  users.forEach(user => {
    $list_users.innerHTML += buildUser(user.nickname, "...", id, user.id)
  });

  let chat_global = await getChatGlobal()
  let $messages = document.getElementById("messages")
  chat_global.forEach(message => {
    $messages.innerHTML += buildMessage(message.message)
  });

  console.log(chat_global)
  console.log("Despues del ajax")

  let websocket = new WebSocket(`ws://localhost:8000/ws/${nickname}`);
  websocket.onmessage = function (event) {
    message_config
    buildMessage(event.data)
  }

  setWs(websocket)
})();

function setWs(websocket) {
  ws = websocket
}

function sendMessage(event) {
  var input = document.getElementById("messageText")
  message_config.message = input.value
  console.log(message_config)
  ws.send(String(message_config))
  input.value = ''
  event.preventDefault()
}

