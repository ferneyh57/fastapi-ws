base_url = `ws://localhost:8000/ws/${client_id}/${client_id}`;
client_id = localStorage.getItem("client_id");
if (client_id == null) {
    client_id = Date.now().toString();
}
document.querySelector("#ws-id").textContent = client_id;
var ws = new WebSocket(base_url);

ws.onmessage = function (event) {
    var messages = document.getElementById("messages");
    var message = document.createElement("li");
    var content = document.createTextNode(event.data);
    message.appendChild(content);
    messages.appendChild(message);
};

function sendMessage(event) {
    var input = document.getElementById("messageText");
    ws.send(input.value);
    input.value = "";
    event.preventDefault();
}

const input = document.getElementById("destinationId");
input.addEventListener("change", updateValue);
function updateValue(e) {
    destination = e.target.value;
    if (destination !== "") {
        ws.url = `ws://localhost:8000/ws/${client_id}/${destination}`;
    } else {
        ws.url = base_url;
    }
}
