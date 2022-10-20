var ws

(async function () {
  let nicknameLocalStorage = localStorage.getItem("nickname")
  let nickname = ""

  const showDialog = () => {
    return new Promise((resolve, reject) => {
      resolve(swal("Escribe tu nombre de usuario:", {
        content: "input",
        inputValidator: (value) => {
          if (value == "") {
            return '¡Debe ingresar por lo mens un valor!'
          }
        },
      }));
    });
  }

  if (nicknameLocalStorage == "" || nicknameLocalStorage == null) {
    nickname = await showDialog();

    swal(`Te has registrado como: ${nickname}`)
    localStorage.setItem("nickname", nickname)
    document.querySelector("#ws-id").textContent = nickname
  } else {
    nickname = nicknameLocalStorage
    document.querySelector("#ws-id").textContent = nicknameLocalStorage
  }

  console.log("Se cumplioo la promesa")
  let websocket = new WebSocket(`ws://localhost:8000/ws/${nickname}/${nickname}`);
  websocket.onmessage = function (event) {
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
    var contentText = document.createTextNode(event.data)

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

  setWs(websocket)
})();

function setWs(websocket) {
  ws = websocket
}

function sendMessage(event) {
  if (ws != any) {
    var input = document.getElementById("messageText")
    ws.send(input.value)
    input.value = ''
    console.log("ws register")
  }
  console.log("ws NOT register")
  event.preventDefault()
}

