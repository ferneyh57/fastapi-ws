//FIXME: añadir un modal para recibir el cliente de forma dinamica.
var client_id = 'ferney'
document.querySelector("#ws-id").textContent = client_id;
var ws = new WebSocket(`ws://localhost:8000/ws/${client_id}/${client_id}`);
ws.onmessage = function (event) {
  //// MENSAJES GLOBALES
  /// Contenido html para los mensajes. 
  /// En esta variable se obtiene la etiqueta html que muestra los mensajes.
  var contentForAllMessage = document.getElementById('messages')

  /// MENSAJE A MOSTRAR
  var contentForMessages = document.createElement('div')
  /// Contenido html para el mensaje a mostrar.
  /// En esta variable se guardara la etiqueta <p>Aqui va el mensaje recibido</p>, 
  var contentForMessage = document.createElement('div')
  /// Contenido html para el texto del mensaje a mostrar.
  /// En esta se introduce el mensaje recibido.
  var contentForMesssageText = document.createElement('p')
  /// Texto del mensaje recibido.
  var contentText = document.createTextNode(event.data)

  /// CREACION DE LA FECHA Y HORA EN LA QUE SE RECIBIO EL MENSAJE.
  /// Contenido html para la fecha y hora en la que se recibe el mensaje.
  var contentForTimeText = document.createElement('p')
  let currentDate = new Date();
  /// Texto de la fecha actual con formato YYYY/MM/DD
  let cDate = currentDate.getFullYear() + '/' + (currentDate.getMonth() + 1) + '/' + currentDate.getDay()
  /// Texto de la hora actual con formato HH:MM
  let contentTimeText = document.createTextNode(currentDate.getHours() + ":" + currentDate.getMinutes() + " | " + cDate)

  /// CREACION DE ESTILOS CSS CON BOTSTRAP
  /// Asignacion de clases para el estilo del contenido del mensaje
  contentForMessages.classList.add("media-body")
  contentForMessage.classList.add("bg-light", "rounded", "py-2", "px-3", "mb-2")
  /// Asignacion de clases para el estilo del contenido del texto del mensaje
  contentForMesssageText.classList.add("text-small", "mb-0", "text-muted")
  /// Asignacion de clases para el estilo del contenido de la fecha y hora
  contentForTimeText.classList.add("small", "text-muted")

  /// AGREGACION DEL MENSAJE RECIBIDO DENTRO DE LOS MENSAJES
  contentForMesssageText.appendChild(contentText)
  contentForMessage.appendChild(contentForMesssageText)
  contentForTimeText.appendChild(contentTimeText)
  contentForMessages.appendChild(contentForMessage)
  contentForMessages.appendChild(contentForTimeText)
  contentForAllMessage.appendChild(contentForMessages)
};
function sendMessage(event) {
  var input = document.getElementById("messageText")
  ws.send(input.value)
  input.value = ''
  event.preventDefault()
}