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

function buildMessage(message, sender = "", date) {
  let currentDate = new Date(date * 1000);
  console.log(date)
  /// Texto de la fecha actual con formato YYYY/MM/DD
  let cDate = currentDate.getFullYear() + '/' + (currentDate.getMonth() + 1) + '/' + currentDate.getDay()
  /// Texto de la hora actual con formato HH:MM
  let timeText = currentDate.getHours() + ":" + currentDate.getMinutes() + " | " + cDate

  return `<div class="media-body">
    <div class="bg-light rounded py-2 px-3 mb-2">
      <p class="text-small mb-0 text-muted">${sender}: ${message}</p>
    </div>
    <p class="small text-muted">${timeText}</p>
  </div>`
}

function buildUser(subtitle, sender, receiver, status) {
  receiver = sender == receiver ? "global" : receiver
  return `<a onclick="builPersonalChat('${sender}', '${receiver}')" class="list-group-item list-group-item-action active text-white rounded-0">
    <div class="media"><img src="https://bootstrapious.com/i/snippets/sn-chat/avatar.svg" alt="user"
      width="50" class="rounded-circle">
      <div class="media-body ml-4">
        <div class="d-flex align-items-center justify-content-between mb-1">
          <h6 class="mb-0">${receiver}</h6><small id="${receiver}-status" class="small font-weight-bold">${status}</small>
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

async function getChatPersonal(sender, receiver) {
  var chat_personal
  await ajax({
    url: `${MESSAGES}/${sender}/${receiver}`,
    cbSuccess: async (reponse_chat_global) => {
      chat_personal = reponse_chat_global
    }
  });
  return chat_personal
}

async function buildMessageList(sender = "", receiver = "") {
  let chat_list
  if (sender == "" || receiver == "") {
    console.log("Mensajes globales")
    chat_list = await getChatGlobal()
  } else {
    console.log(`Mensajes con ${receiver}`)
    chat_list = await getChatPersonal(sender, receiver)
  }
  let $chat_messages = document.getElementById("messages")
  $chat_messages.innerHTML = ""
  chat_list.forEach(message => {
    console.log(message.message)
    $chat_messages.innerHTML += buildMessage(message.message, message.sender, message.date)
  });

}
async function builPersonalChat(sender, receiver) {
  document.getElementById("name-receiver").textContent = receiver
  message_config.receiver = receiver;
  buildMessageList(sender, receiver)
  scrollChatToDown()
}


async function buildListUsers(nickname) {
  let users = await getUsers()
  let $list_users = document.getElementById("list-users")

  $list_users.innerHTML = ""
  users.forEach(user => {
    $list_users.innerHTML += buildUser("...", nickname, user.nickname, user.status)
  });
}

const scrollChatToDown = (id = "chat-box") => {
  const element = document.getElementById(id);
  element.scrollTop = element.scrollHeight;
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

    Swal.fire({
      title: `Bienvenido ${nickname}`,
    })

    localStorage.setItem("nickname", nickname)
    localStorage.setItem("id", id)
    document.querySelector("#ws-id").textContent = nickname
  } else {
    id = idLocalStorage
    nickname = nicknameLocalStorage
    document.querySelector("#ws-id").textContent = nicknameLocalStorage
  }
  message_config.user.id = id
  message_config.user.nickname = nickname
  message_config.user.status = true

  await buildListUsers(nickname)

  await buildMessageList()
  scrollChatToDown()
  let websocket = new WebSocket(`ws://localhost:8000/ws/${nickname}`);

  websocket.onmessage = function (event) {
    let $chat_messages = document.getElementById("messages")
    let message_response = JSON.parse(event.data);
    $chat_messages.innerHTML += buildMessage(message_response.message, nickname, message_response.date)
    scrollChatToDown()
  }

  setWs(websocket)
})();

function setWs(websocket) {
  ws = websocket
}

function sendMessage(event) {
  var input = document.getElementById("messageText")
  message_config.message = input.value
  let str_message_config = JSON.stringify(message_config)
  console.log(str_message_config)
  ws.send(str_message_config)
  input.value = ''
  event.preventDefault()
}

