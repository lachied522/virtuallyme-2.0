function setCookie(cname, cvalue, days) {
    //expires at end of current month
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  let expires = "expires="+ endOfMonth.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    console.log(decodedCookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
}
  
  function typeWriter(element, text){
    element.textContent = "";
    let index = 0;
    let interval = setInterval(() => {
        if (index < text.length){
            element.textContent += text.charAt(index);
            element.scrollTop = element.scrollHeight;
            index++;
        } else {
            clearInterval(interval);
        }
    }, 10)
}

function waiting(element) {
    element.textContent = "Thinking";
    var ellipsis = ". "
    waitingInterval = setInterval(() => {
        element.textContent = "Thinking" + ellipsis;
        ellipsis += ". "
        if (ellipsis === ". . . . ") {
            ellipsis = ". ";
        }
    }, 400);
}

function detectGPT(container, score){
    if (score<0) {
        container.querySelector(".text-200.detection-text").innerHTML = `NA`;
    } else {
        container.querySelector(".text-200.detection-text").innerHTML = `${score}%`
        if (score<=33) {
            container.querySelector(".text-200.detection-text").style.color = "#05c168"; //green
        } else if (score<=67) {
            container.querySelector(".text-200.detection-text").style.color = "#ffb016"; //yellow
        } else {
            container.querySelector(".text-200.detection-text").style.color = "#ff5a65"; //red
        }
        container.style.display = "flex"; //display the container
    }
}

function submitTask(socket) {
  if(isWaiting){
      //if still waiting, do nothing
      return
  }
  var form = document.querySelector("[customID='submit-task']");
  var typeElement = form.querySelector("[customInput='type']");
  var topicElement = form.querySelector("[customInput='topic']");
  var lengthElement = form.querySelector("[customID='output-length']");

  var empty = [];
  if(typeElement.value===""){
      empty.push(typeElement);
  }
  if(topicElement.value===""){
      empty.push(topicElement);
  }
  var additionalElement = form.querySelector("[customInput='additional']");
  const data = {
      "member_id": member,
      "job_id": -1,
      "category": "task",
      "type": typeElement.value, 
      "topic": topicElement.value, 
      "additional": additionalElement.value,
      "length": lengthElement.value,
      "search": "false"
  };

  //if neither type or topic element is missing
  if(empty.length==0){
        var destination = document.querySelector("[customID='task-output']");
        waiting(destination);
        isWaiting = true;
        socket.addEventListener("message", function receive(event) {
            let response = JSON.parse(event.data);
            let data = response.message;
            if (data==="[START MESSAGE]") {
                clearInterval(waitingInterval);
                destination.textContent = "";
            } else if (data!=="[END MESSAGE]") {
                destination.textContent += data;
                destination.scrollTop = destination.scrollHeight;
            } else {
                isWaiting = false;
                this.removeEventListener("message", receive);
                //reset feedback bar
                var words = destination.textContent.split(" ").length;
                document.querySelector("[customID='task-word-count']").innerHTML = `${words}`;
                detectGPT(document.querySelector("[customID='task-score']").parentElement, response.score);
                if(uses > -1){
                    uses++;
                    useCountElement.innerHTML = "Monthly uses " + String(uses) + "/5"
                    setCookie("uses", uses, 0);
                    if(uses === 5){
                        document.querySelector("[customID='try-free']").style.display = "flex";
                        document.querySelector("[customID='generate-button']").style.display = "none";
                    }
                }
            }
        });
        socket.addEventListener("close", function handle_close() {
            clearInterval(waitingInterval);
            isWaiting = false;
            destination.textContent = "There was an error generating your response. Please try again.";
            this.removeEventListener("close", handle_close);
        });
        socket.send(JSON.stringify(data));
        } else {
            var originalColor = empty[0].style.borderColor;
            empty[0].style.borderColor = "#FFBEC2";
            setTimeout(function() {
                empty[0].style.borderColor = originalColor;
            }, 1500);
            return
        }             
    }

let uses = -1;
var useCountElement = document.querySelector("[customID='uses-count']");
window.$memberstackDom.getCurrentMember().then((member) => {
    const maxUses = 5;
    if (member.data) {
        document.querySelectorAll(".btn-secondary.login").forEach(button => {
        button.style.display = "none";
        });
        document.querySelectorAll(".btn-primary.sign-up").forEach(button => {
        button.style.display = "none";
        });
        document.querySelectorAll(".btn-primary.dashboard").forEach(button => {
        button.style.display = "flex";
        });
            useCountElement.parentElement.style.display = "none";
    } else {
        let uses = parseInt(getCookie("uses")) || 0;
        useCountElement.innerHTML = "Monthly uses " + String(uses) + "/5";
        if (uses < maxUses) {
                document.querySelector("[customID='try-free']").style.display = "none";
        } else {
            document.querySelector("[customID='try-free']").style.display = "flex";
        document.querySelector("[customID='generate-button']").style.display = "none";
        }
    }
})


document.addEventListener("DOMContentLoaded", () => {
    socket = new WebSocket(WEB_SOCKET_URL);

    document.querySelector(".generate-button").addEventListener("click", () => {
        if(socket.readyState !== WebSocket.CLOSED){
            submitTask(socket);
        } else {
            socket = new WebSocket(WEB_SOCKET_URL);
            socket.addEventListener("open", () => {
                submitTask(socket);
            });
        }
    })
});

const WEB_SOCKET_URL = "wss://virtuallyme2-0.onrender.com/ws"
let isWaiting = false;

