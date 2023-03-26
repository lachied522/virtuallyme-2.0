function hidePreloader() {
    const preloader = document.querySelector(".preloader");
    preloader.style.transition = "opacity 0.5s ease-out";
    preloader.style.opacity = 0;
    setTimeout(function() {
        preloader.style.display = "none";
    }, 500);
}

function typeWriter(element, text){
    element.textContent = "";
    let index = 0;
    let interval = setInterval(() => {
        if (index < text.length){
            element.textContent += text.charAt(index);
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

function popupOpen(popupWrapper) {
    const popup = popupWrapper.querySelector('.popup');
  
    // set initial state
    popupWrapper.style.opacity = '0';
    popup.style.transform = 'scale(0.6)';
    
    // show popup wrapper
    popupWrapper.style.display = 'flex';
  
    // animate popup wrapper
    popup.animate([
      { transform: 'scale(0.6)' },
      { transform: 'scale(1.0)' },
    ], {
      duration: 300,
      easing: 'ease'
    });

    popupWrapper.animate([
        { opacity: '0' },
        { opacity: '1'}
      ], {
        duration: 200,
        easing: 'ease'
    });
  
    // set final state
    popupWrapper.style.opacity = '1';
    popup.style.transform = 'scale(1.0)';

}

function popupClose(popupWrapper) {
    const popup = popupWrapper.querySelector('.popup');
  
    popup.animate([
      { transform: 'scale(1.0)' },
      { transform: 'scale(0.6)' }
    ], {
      duration: 300,
      easing: 'ease'
    });

    popupWrapper.animate([
        { opacity: '1' },
        { opacity: '0' }
      ], {
        duration: 200,
        easing: 'ease'
    });
    
    // set final state
    popupWrapper.style.display = 'none';
    popupWrapper.style.opacity = '0';
    popup.style.transform = 'scale(0.6)';
}

function removeSampleConfirm(sampleWrapper){
    sampleWrapper.querySelector(".btn-secondary.remove").style.display = 'none';
    sampleWrapper.querySelector(".btn-secondary.confirm").style.display = 'flex';
    sampleWrapper.querySelector(".text-200").style.display = 'block';
}


function featuresTaskOpen(module){
  bodyContainer = module.querySelector(".features-tasks-body-container");
  dropdownArrow = module.querySelector(".dropdown-wrapper");
  bodyContainer.classList.toggle("open");
  dropdownArrow.classList.toggle("open");
}

function feedbackAnimation(feedbackBar, feedback){
  feedbackBar.querySelectorAll(".feedback-button").forEach(btn => {
      btn.style.display = "none";
  })
  if(feedback==="positive"){
      feedbackBar.querySelector(".feedback-button.positive.clicked").style.display = "flex";
  } else {
      feedbackBar.querySelector(".feedback-button.negative.clicked").style.display = "flex";
  }
}

function removeFeedbackAnimation(feedbackBar){
    feedbackBar.querySelectorAll(".feedback-button").forEach(btn => {
        btn.style.display = "none";
    })
    feedbackBar.querySelector(".feedback-button.positive").style.display = "flex";
    feedbackBar.querySelector(".feedback-button.negative").style.display = "flex";
  }

function updateUserWords(value){
    userWordCount = value;
    document.querySelectorAll("[customID='user-word-count']").forEach(element => {
        element.innerHTML = `Words this month: ${userWordCount}`;
    })
}

function newJob(jobName){
    let index = userJobs.length;
    let jobElement = document.querySelectorAll("[customID='job-container']")[index];
    //add job name to job Element
    jobElement.setAttribute("jobID", -1);
    jobElement.querySelector("[customID='job-name']").value = jobName;
    userJobs.push(jobName);
    //increase job count
    document.querySelector("[customID='job-count']").innerHTML = String(userJobs.length)+"/"+String(maxJobs);
    document.querySelectorAll("[customID='user-job-list']").forEach(element => {
        element.innerHTML += `<option>${jobName}</option>`;
    });
    //show job tab button
    var jobTabButtons = document.querySelectorAll(".job-tab");
    jobTabButtons[index].style.display = "block";
    jobTabButtons[index].innerHTML = jobName;
    //set text area resize to none prior to cloning
    jobElement.querySelector("[customID='sample-text']").style.resize = "none";
    return jobElement
}

function updateJobWords(jobElement, value){
    let wordCountElement = jobElement.querySelector("[customID='job-word-count']");
    
    if(value<=0){
        wordCountElement.innerHTML = "0/"+jobMaxWords.toLocaleString();
        jobElement.querySelector("[customID='samples-empty-text']").style.display = "block";
    } else {
        wordCountElement.innerHTML = value+"/"+jobMaxWords.toLocaleString();
        jobElement.querySelector("[customID='samples-empty-text']").style.display = "none";
    }
}

function newSample(jobElement, sampleWrapper, completion){
    let sampleClone = sampleWrapper.parentElement.cloneNode(true);
    sampleClone.querySelector("[customID='sample-prompt-display']").innerHTML = completion.slice(0, 120);
    sampleClone.querySelector("[customID='sample-text']").innerHTML = completion;
    //add remove button functionality
    sampleClone.querySelector("[customID='remove-button']").addEventListener("click", () => {
        removeSample(jobElement, sampleClone);
    });
    //cloneNode does not clone animations, must add back in
    sampleClone.querySelector(".sample-wrapper").addEventListener("click", () => {
        popupOpen(sampleClone.querySelector(".popup-wrapper"));
    });
    sampleClone.querySelector(".close-button-popup-module").addEventListener("click", () => {
        popupClose(sampleClone.querySelector(".popup-wrapper"));
    });
    sampleClone.querySelector(".btn-secondary.remove").addEventListener("click", () => {
        removeSampleConfirm(sampleClone);
    });
    sampleClone.querySelector(".btn-secondary.confirm").addEventListener("click", () => {
        popupClose(sampleClone.querySelector(".popup-wrapper"));
    });
    sampleClone.querySelector(".btn-secondary.green").addEventListener("click", () => {
        popupClose(sampleClone.querySelector(".popup-wrapper"));
    });

    sampleClone.querySelector(".sample-wrapper").style.display = "flex";
    return sampleClone
}

function storeTask(tasksContainer, data){
    let module = tasksContainer.querySelectorAll(".module")[0];
    let taskClone = module.cloneNode(true);

    taskClone.querySelector("[customID='tasks-header']").innerHTML = data.prompt;
    taskClone.querySelector("[customID='tasks-body']").innerHTML = data.completion;
    let sourceContainer = taskClone.querySelector(".task-source-container");
    if(sourceContainer){
        sourceContainer.querySelectorAll(".link").forEach((link, index) => {
            if(index<data.sources.length){
                link.parentElement.href = data.sources[index].url;
                link.parentElement.target = "_blank";
                link.innerHTML = data.sources[index].display;
                link.parentElement.style.display = "block";
            } else {
                link.parentElement.href = "";
                link.innerHTML = "";
                link.parentElement.style.display = "none";
            }
        })
    }
    if(data.feedback){
        if(data.feedback==="positive"){
            feedbackAnimation(taskClone.querySelector(".feedback-bar"), "positive");
        } else if(data.feedback==="negative") {
            feedbackAnimation(taskClone.querySelector(".feedback-bar"), "negative");
        }
    }
    taskClone.querySelector(".features-tasks-title-container").addEventListener("click", () => {
        featuresTaskOpen(taskClone);
    });
    let completion = taskClone.querySelector("[customID='tasks-body']").innerHTML;
    taskClone.querySelector(".feedback-button.positive").addEventListener("click", () => {
        feedbackAnimation(taskClone.querySelector(".feedback-bar"), "positive");
        sendFeedback(completion, "positive");
    });
    taskClone.querySelector(".feedback-button.negative").addEventListener("click", () => {
        feedbackAnimation(taskClone.querySelector(".feedback-bar"), "negative");
        sendFeedback(completion, "negative");
    });
    taskClone.querySelector(".feedback-button.positive.clicked").addEventListener("click", () => {
        removeFeedbackAnimation(taskClone.querySelector(".feedback-bar"));
        sendFeedback(completion, null);
    });
    taskClone.querySelector(".feedback-button.negative.clicked").addEventListener("click", () => {
        removeFeedbackAnimation(taskClone.querySelector(".feedback-bar"));
        sendFeedback(completion, null);
    });
    taskClone.style.display = "block";
    module.after(taskClone);
    tasksContainer.querySelector("[customID='empty-text']").style.display = "none";
  }


function getUser(counter = 0){
    if(counter>=3){
        return
    } else {
        const url = `${WEB_SERVER_BASE_URL}/get_user/${String(member)}`;
        fetch(url, {
            method: "GET",
            headers: {},
        })
        .then(response => response.json())
        .then(data => {
            //store user description and about data
            if(data.description.length>0){
                let descriptionWrapper = document.querySelector(".description-wrapper");
                descriptionWrapper.querySelector(".text-300").innerHTML = data.description;
                descriptionWrapper.style.display = "block";
                document.querySelector(".description-empty-text").style.display = "none";
            }
            //store task data
            for(let i = 0; i < data.tasks.length; i++){
                if (i<5) {
                    storeTask(document.querySelector("#recent-tasks"), data.tasks[i]);
                } 
                if (data.tasks[i].feedback) {
                    storeTask(document.querySelector("#saved-tasks"), data.tasks[i]);
                }
            }
            //store questions data
            for(let i=0; i < data.questions.length; i++){
                if (i<5) {
                    storeTask(document.querySelector("#recent-questions"), data.questions[i]);
                }
                if (data.questions[i].feedback) {
                    storeTask(document.querySelector("#saved-questions"), data.questions[i]);
                }
            }
            //store ideas data
            for(let i=0; i < data.ideas.length; i++){
                if (i<5) {
                    storeTask(document.querySelector("#recent-ideas"), data.ideas[i]);
                }
                if (data.ideas[i].feedback) {
                    storeTask(document.querySelector("#saved-ideas"), data.ideas[i]);
                }
            }
            //store rewrite data
            for(let i = 0; i < data.rewrites.length; i++){
                if (i<5) {
                    storeTask(document.querySelector("#recent-rewrites"), data.rewrites[i]);
                }
                if (data.rewrites[i].feedback) {
                    storeTask(document.querySelector("#saved-rewrites"), data.rewrites[i]);
                }
            }
            //update user word count
            updateUserWords(data.words);
            //add job data
            for(let i=0; i < data.user.length; i++){
                let newJobElement = newJob(data.user[i].name);
                //set job_id
                newJobElement.setAttribute("jobID", data.user[i].job_id);
                
                let samplesGrid = newJobElement.querySelector(".samples-grid");
                let sampleWrapper = samplesGrid.querySelector(".sample-wrapper");
                for(let j=0; j < data.user[i].data.length; j++){
                    samplesGrid.appendChild(newSample(newJobElement, sampleWrapper, data.user[i].data[j].completion));
                }
                updateJobWords(newJobElement, data.user[i].word_count);
                newJobElement.setAttribute("saved", "true");
            }
            if (data.user.length>0||data.words>0) {
                //hide welcome popup
                document.querySelector(".welcome-popup").style.display = "none"; 
            }
            hidePreloader();
        })
        .catch(error => {
            console.log(error);
            setTimeout(() => {
                getUser(counter+1);
            }, 30);
        })
    }
}

function syncJob(jobElement) {
    const url = "https://virtuallyme.onrender.com/sync_job";

    var samplePrompts = jobElement.querySelectorAll("[customID='sample-prompt']");
    var sampleTexts = jobElement.querySelectorAll("[customID='sample-text']");

    let saveButton = jobElement.querySelector("[customID='save-button']");
    let savingButton = jobElement.querySelector("[customID='saving-button']");
    let savedButton = jobElement.querySelector("[customID='saved-button']");

    saveButton.style.display = "none";
    savingButton.style.display = "flex";
    savedButton.style.display = "none";

    var body = {
        "member_id": member, 
        "name": userName, 
        "job_name": jobElement.querySelector("[customID='job-name']").value, 
        "job_id": jobElement.getAttribute("jobID")
    };
    var dataArray = [];
    for(let i = 0; i < samplePrompts.length; i++){
        var prompt = samplePrompts[i].innerHTML;
        var text = sampleTexts[i].innerHTML;
        if(text !== ""){
            var data = {
                "prompt": prompt,
                "completion": text
            }
            dataArray.push(data);
        }
    }
    body["data"]=dataArray;
    fetch(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json"
        },
    })
    .then(response => {
        saveButton.style.display = "none";
        savingButton.style.display = "none";
        savedButton.style.display = "flex";
        jobElement.setAttribute("saved", "true");
    })
    .catch(error => {
        console.error("Error loading data:", error);
        saveButton.style.display = "none";
        savingButton.style.display = "none";
        savedButton.style.display = "flex";
        jobElement.setAttribute("saved", "false");
    });
}

function createJob(counter = 0) {
    if(userJobs.length===maxJobs){
        //max jobs
        return
    } else if(counter>=3){
        return
    } else {
        const url = "https://virtuallyme.onrender.com/create_job"
        var form = document.querySelector("[customID='create-new-job']");
        
        if (form.querySelector("[customInput='new-job-name']").value.length > 0) {
            var newJobName = form.querySelector("[customInput='new-job-name']").value;
        } else {
            var newJobName = "My Job";
        }
        
        var popupWrapper = document.querySelector(".popup-wrapper.create-job")
        var createButton = popupWrapper.querySelector("[customID='create-job-button']");
        var savingButton = popupWrapper.querySelector(".btn-secondary.small.saving-button")

        createButton.style.display = "none";
        savingButton.style.display = "flex";
        fetch(url, {
            method: "POST",
            body: JSON.stringify({"member_id": member, "job_name": newJobName}),
            headers: {
                "Content-Type": "application/json"
            },
        })
        .then(response => response.json())
        .then(data => {       
            var newJobElement = newJob(newJobName);
            updateJobWords(newJobElement, 0);
            newJobElement.setAttribute("jobID", data.job_id);
            popupClose(popupWrapper);
            form.reset();
            createButton.style.display = "flex";
            savingButton.style.display = "none";
        })
        .catch(error => {
            setTimeout(() => {
                createJob(counter+1);
            }, 30);
        });
    }
}

function addSample(jobElement) {
    let files = document.getElementById("upload-file").files;
    if(files.length>0){
        uploadFiles(jobElement, files);
        Array.from(jobElement.querySelectorAll(".file-container")).slice(1).forEach(container => {
            container.remove();
        });
        document.getElementById("upload-file").value = "";
        jobElement.querySelector(".upload-empty-container").style.display="flex";
    } else {    
        var form = jobElement.querySelector("[customID='add-sample']");
        var textElement = form.querySelector("[customInput='text']");

        var wordCountElement = jobElement.querySelector("[customID='job-word-count']");
        var currentWords = parseInt(wordCountElement.innerHTML.split("/")[0]);
        var newWords = textElement.value.split(" ").length;

        if(currentWords+newWords>=jobMaxWords){
            console.log("max words");
            return
        }
        
        if(textElement.value.length>0){
            let samplesGrid = jobElement.querySelector(".samples-grid");
            let sampleWrapper = samplesGrid.querySelectorAll(".sample-wrapper")[0];
            samplesGrid.appendChild(newSample(jobElement, sampleWrapper, textElement.value));
            //reset text elements (don't use form.reset())
            textElement.value = "";
            //increase job word count
            updateJobWords(jobElement, currentWords+newWords);
            jobElement.setAttribute("saved", "false");
            jobElement.querySelector("[customID='save-button']").style.display = "flex";
            jobElement.querySelector("[customID='saving-button']").style.display = "none";
            jobElement.querySelector("[customID='saved-button']").style.display = "none";
        } else {
            var originalColor = textElement.style.borderColor;
            textElement.style.borderColor = "#FFBEC2";
            setTimeout(function() {
                textElement.style.borderColor = originalColor;
            }, 1500);
            return
        }
    }
}

function uploadFiles(jobElement, files) {
    const url = "https://virtuallyme.onrender.com/read_files";
    const accept = ["pdf", "docx"];
    const formData = new FormData();
    for(let i = 0; i < files.length; i++){
        let array = files[i].name.split(".");
        if(accept.includes(array[array.length-1])){
            formData.append('file', files[i], files[i].name);
        }
    }
    jobElement.querySelector(".loading-container").style.display = "flex";
    fetch(url, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        let samplesGrid = jobElement.querySelector(".samples-grid");
        let sampleWrapper = samplesGrid.querySelectorAll(".sample-wrapper")[0];
        var wordCountElement = jobElement.querySelector("[customID='job-word-count']");
        var currentWords = parseInt(wordCountElement.innerHTML.split("/")[0]);
        var newWords = 0;
        for(let i=0; i<data.texts.length; i++){
            samplesGrid.appendChild(newSample(jobElement, sampleWrapper, data.texts[i]));
            newWords += data.texts[i].length;
        }
        updateJobWords(jobElement, currentWords+newWords);
        jobElement.querySelector(".loading-container").style.display = "none";
        jobElement.setAttribute("saved", "false");
        jobElement.querySelector("[customID='save-button']").style.display = "flex";
        jobElement.querySelector("[customID='saving-button']").style.display = "none";
        jobElement.querySelector("[customID='saved-button']").style.display = "none";
    })
    .catch(error => {
        console.log(error);
    });
}

function removeSample(jobElement, sampleWrapper){
    let sampleWords = sampleWrapper.querySelector("[customID='sample-text']").value.split(" ").length;
    sampleWrapper.remove();
    //adjust word count
    let wordCountElement = jobElement.querySelector("[customID='job-word-count']");
    let currentWords = parseInt(wordCountElement.innerHTML.split("/")[0]);
    updateJobWords(jobElement, currentWords-sampleWords);
    //show save button
    jobElement.querySelector("[customID='save-button']").style.display = "flex";
    jobElement.querySelector("[customID='saving-button']").style.display = "none";
    jobElement.querySelector("[customID='saved-button']").style.display = "none";
}

function removeJob(jobElement){
    const url = "https://virtuallyme.onrender.com/remove_job";
    var body = {
        "member_id": member,
        "job_id": jobElement.getAttribute("jobID")
    };
    fetch(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json"
        },
    }).then(response => {
        if(response.ok){
            location.reload();
        }    
    })
}

function configTask(taskWrapper){
    textareas = taskWrapper.querySelectorAll("textarea");
    textareas.forEach(textarea => {
        if(textarea.hasAttribute("customInput")){
            //maxlength for additional instructions 400 characters
            textarea.maxLength = 400;
        }
        textarea.addEventListener("input", () => {
            //set all textareas to scroll on input
            textarea.scrollTop = textarea.scrollHeight;
        })
    });
    //want job selector to update depending on value of "type" element
    var userJobsList = taskWrapper.querySelector("[customID='user-job-list']");
    var typeElement = taskWrapper.querySelector("[customInput='type']");
    typeElement.addEventListener("change", ()=>{
        for(let i=0; i<userJobs.length; i++){
            if(userJobs[i].toLowerCase().includes(typeElement.value.toLowerCase())){
                userJobsList.value = userJobs[i];
                return
            }
        }
    });
}

function share(jobElement, counter=0){
    //call sync function first
    //syncJob(jobNumber);
    const url = "https://virtuallyme.onrender.com/share_job";
    var form = jobElement.querySelector("[customID='share-job']");
    var body = {
        "member_id": member,
        "job_id": jobElement.getAttribute("jobID"),
        "description": form.querySelector("[customInput='description']").value,
        "instructions": form.querySelector("[customInput='instructions']").value,
        "access": form.querySelector("[customInput='access']").value
    };
    fetch(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json"
        },
    }).then(response => {
        if(!response.ok){
            if(counter<3){
                setTimeout(() => {
                    share(jobElement, counter+1)
                }, 30)
            }
        }
    })
}


function removeSharedJob(id){
    const url = "https://virtuallyme.onrender.com/remove_shared_job"
    const body = {
        "member_id": id,
        "job_id": id
    }
    //first remove job from db
    fetch(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json"
        },
    })
}

function generateIdeas(socket) {
    if(isWaiting){
        //if still waiting, do nothing
        return
    } else if(userWordCount>userMonthlyWords){
        document.querySelector("[customID='ideas-output']").textContent = "You have reached your maximum word limit for this month.\n\nUpgrade your plan to increase your limit."
        return
    }
    var form = document.querySelector("[customID='ideas-form']");
    var typeElement = form.querySelector("[customInput='type']");
    var topicElement = form.querySelector("[customInput='topic']");

    //check if either typeElement or topic are missing
    var empty = [];
    if(typeElement.value===""){
        empty.push(typeElement);
    }
    if(topicElement.value===""){
        empty.push(topicElement);
    }
    const data = {
        "name": userName,
        "member_id": member, 
        "category": "idea",
        "type": typeElement.value, 
        "topic": topicElement.value
    };
    if(empty.length==0){
        document.querySelector("[customID='idea-word-count']").innerHTML = `Word count __`;
        var destination = document.querySelector("[customID='ideas-output']");
        waiting(destination);
        isWaiting = true;
        socket.addEventListener("message", function receive(event) {
            if (isWaiting) {
                destination.textContent = "";
                clearInterval(waitingInterval);
                isWaiting = false;
            }
            let response = JSON.parse(event.data);
            let data = response.message;
            if (data!=="[END MESSAGE]") {
                destination.textContent += data;
            } else {
                this.removeEventListener("message", receive);
                isWaiting = false;
                //update user words
                var words = destination.textContent.split(" ").length;
                document.querySelector("[customID='idea-word-count']").innerHTML = `Word count: ${words}`;
                updateUserWords(userWordCount+words);
                //store task
                var recentIdeasContainer = document.querySelector("#recent-ideas");
                storeTask(recentIdeasContainer, {"prompt": `Generate content ideas for my ${typeElement.value}`, "completion": destination.textContent.split()}); 
                var taskLength = recentIdeasContainer.querySelectorAll(".module").length;
                if(taskLength-1>5){
                    recentIdeasContainer.querySelectorAll(".module")[taskLength-1].remove();
                } 
            }
        });
        socket.addEventListener("close", function handle_close()  {
            clearInterval(waitingInterval);
            isWaiting = false;
            destination.textContent = "There was an error, please try again later. I apologise for the inconvenience.";
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

function submitRewrite(socket) {
    if(isWaiting){
        //if still waiting, do nothing
        return
    } else if(userWordCount > userMonthlyWords){
        document.querySelector("[customID='rewrite-output']").textContent = "You have reached your maximum word limit for this month.\n\nUpgrade your plan to increase your limit."
        return
    }
    var form = document.querySelector("[customID='submit-rewrite']");
    var textElement = form.querySelector("[customInput='text']");
    //get ID of selected job
    var jobIndex = form.querySelector("[customID='user-job-list']").selectedIndex-1;
    if(jobIndex<0||jobIndex>userJobs.length){
        var jobID = -1
    } else {
        var jobID = document.querySelectorAll("[customID='job-container']")[jobIndex].getAttribute("jobID");
    }
    var additionalElement = form.querySelector("[customInput='additional']");
    const data = {
        "name": userName,
        "category": "rewrite",
        "member_id": member,
        "job_id": jobID,
        "text": textElement.value, 
        "additional": additionalElement.value
    };
    //check text element is not empty
    if(textElement.value !== ""){
        document.querySelector("[customID='rewrite-word-count']").innerHTML = "Word count __";
        var destination = document.querySelector("[customID='rewrite-output']");
        waiting(destination);
        isWaiting = true;
        socket.addEventListener("message", function receive(event) {
            if (isWaiting) {
                destination.textContent = "";
                clearInterval(waitingInterval);
                isWaiting = false;
            }
            let response = JSON.parse(event.data);
            let data = response.message;
            if (data!=="[END MESSAGE]") {
                destination.textContent += data;
            } else {
                this.removeEventListener("message", receive);
                //update user words
                var words = destination.textContent.split(" ").length;
                document.querySelector("[customID='rewrite-word-count']").innerHTML = `Word count: ${words}`;
                updateUserWords(userWordCount+words);
                //store task
                var rewritesContainer = document.querySelector("#recent-rewrites");
                storeTask(rewritesContainer, {"prompt": `Rewrite the following: ${textElement.value.slice(0, 120)}`, "completion": destination.textContent});
                var taskLength = rewritesContainer.querySelectorAll(".module").length;
                if(taskLength-1>5){
                    rewritesContainer.querySelectorAll(".module")[taskLength-1].remove();
                } 
            }
        });
        socket.addEventListener("close", function handle_close()  {
            clearInterval(waitingInterval);
            isWaiting = false;
            destination.textContent = "There was an error, please try again later. I apologise for the inconvenience.";
            this.removeEventListener("close", handle_close);
        });
        socket.send(JSON.stringify(data));
    } else {
        var originalColor = textElement.style.borderColor;
        textElement.style.borderColor = "#FFBEC2";
        setTimeout(function() {
            textElement.style.borderColor = originalColor;
        }, 1500);
        return
    }      
}

function searchToggle(searchElement){
    if(searchElement.getAttribute("on")==="true"){
        searchElement.setAttribute("on", "false");
    } else {
        searchElement.setAttribute("on", "true");
    }
}

function sendFeedback(completion, feedback){
    const url = "https://virtuallyme.onrender.com/handle_feedback";
    //get recent task
    var data = {
        "member_id": member,
        "feedback": feedback, 
        "completion": completion
    }
    fetch(url, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        },
    });
}

function pageLoad(){
    getUser();
    //add create job funcionality
    document.querySelector("[customID='create-job-button']").addEventListener("click", ()=> {
        createJob();
    });
    //add functionality to jobs 
    document.querySelectorAll("[customID='job-container']").forEach(jobElement => {    
        jobElement.querySelector("[customID='add-button']").addEventListener("click", () => {
            addSample(jobElement);
        });

        jobElement.querySelector("[customID='save-button']").addEventListener("click", () => {
            syncJob(jobElement);
        });
        jobElement.querySelector("[customID='share-button']").addEventListener("click", () => {
            share(jobElement);
        });
        jobElement.querySelector("[customID='remove-job-button']").addEventListener("click", () => {
            removeJob(jobElement);
        });
    });
    //add functionality to task wrappers
    document.querySelectorAll("[customID='submit-task']").forEach(taskElement => {
        configTask(taskElement);
    });
    //add search toggle functionality
    document.querySelectorAll("[customID='search-toggle']").forEach(searchElement => {
        searchElement.addEventListener("click", () => {
            searchToggle(searchElement);
        });
        searchElement.setAttribute("on", "false");
    });
    //add feedback functionality for new task
    let feedbackBar = document.querySelector(".feedback-bar");
    feedbackBar.querySelector("[customID='positive-feedback-button']").addEventListener("click", () => {
        feedbackBar.style.display = "none";
        document.querySelector(".feedback-text").style.display = "block";
    });
    feedbackBar.querySelector("[customID='negative-feedback-button']").addEventListener("click", () => {
        feedbackBar.style.display = "none";
        document.querySelector(".feedback-text").style.display = "block";
    });
    
    //add feedback button functionality for stored tasks
    document.querySelectorAll(".task-feedback-bar").forEach(element => {
        element.querySelector("[customID='positive-feedback-button']").addEventListener("click", function() {
            sendFeedback('positive');
        })
    });
    document.querySelectorAll("[customID='negative-feedback-button']").forEach(element => {
        element.addEventListener("click", function() {
            sendFeedback('negative');
        })
    });
    document.querySelectorAll("[customID='job-container']").forEach(jobElement => {
        uploadBox = jobElement.querySelector(".upload-sample-box");
        uploadBox.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadBox.parentElement.classList.add('dragover');
        });
        
        uploadBox.addEventListener('dragleave', () => {
            uploadBox.classList.remove('dragover');
        });
    
        uploadBox.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadBox.classList.remove('dragover');
            uploadFiles(jobElement, e.dataTransfer.files);
        });
    });
    document.getElementById("upload-file").addEventListener("change", () => {
        let files = document.getElementById("upload-file").files;
        document.querySelectorAll("[customID='job-container']").forEach(jobElement => {
            let uploadBox = jobElement.querySelector(".upload-sample-box");
            Array.from(uploadBox.querySelectorAll(".file-container")).slice(1).forEach(container => {
                container.remove();
            });
            if(files.length>0){
                let fileContainer = uploadBox.querySelectorAll(".file-container")[0];
                for(let i=0; i<files.length; i++){
                    let newFileContainer = fileContainer.cloneNode(true);
                    newFileContainer.querySelector(".text-200").innerHTML = files[i].name;
                    newFileContainer.style.display = "block";
                    uploadBox.appendChild(newFileContainer);
                }
                uploadBox.querySelector(".upload-empty-container").style.display="none";
            } else {
                uploadBox.querySelector(".upload-empty-container").style.display="flex";
            }
        });
    });
    //periodically save jobs    
    setInterval(()=>{
        document.querySelectorAll("[customID='job-container']").forEach(jobElement => {
            if(jobElement.hasAttribute("saved")){
                if(jobElement.getAttribute("saved")==="false"){
                    syncJob(jobElement);
                }
            }
        })
    }, 60000)
}


function submitTask(socket) {
    if(isWaiting){
        //if still waiting, do nothing
        return
    } else if(userWordCount > userMonthlyWords){
        document.querySelector("[customID='task-output']").textContent = "You have reached your maximum word limit for this month.\n\nUpgrade your plan to increase your limit."
        return
    }
    var form = document.querySelector("[customID='submit-task']");
    var typeElement = form.querySelector("[customInput='type']");
    var topicElement = form.querySelector("[customInput='topic']");
    var searchElement = form.querySelector("[customID='search-toggle']");
    //get ID of selected job
    var jobIndex = form.querySelector("[customID='user-job-list']").selectedIndex-1;
    if(jobIndex<=0||jobIndex>userJobs.length){
        var jobID = -1
    } else {
        var jobID = document.querySelectorAll("[customID='job-container']")[jobIndex].getAttribute("jobID");
    }
    //check if either typeElement or topic are missing
    var empty = [];
    if(typeElement.value===""){
        empty.push(typeElement);
    }
    if(topicElement.value===""){
        empty.push(topicElement);
    }
    var additionalElement = form.querySelector("[customInput='additional']");
    const data = {
        "name": userName,
        "member_id": member,
        "category": "task",
        "job_id": jobID, 
        "type": typeElement.value, 
        "topic": topicElement.value, 
        "additional": additionalElement.value,
        "search": searchElement.getAttribute("on")
    };
    //if neither type or topic element is missing
    if(empty.length==0){
        document.querySelector("[customID='task-word-count']").innerHTML = `Word count __`;

        var sourcesContainer = document.querySelector("[customID='task-sources-container']");
        if(searchElement.getAttribute("on")==="false"){
            sourcesContainer.style.display = "none";
        }

        var destination = document.querySelector("[customID='task-output']");
        waiting(destination);
        isWaiting = true;
        socket.addEventListener("message", function receive(event) {
            var source_data = [];
            if (isWaiting) {
                destination.textContent = "";
                clearInterval(waitingInterval);
                isWaiting = false;
            }
            let response = JSON.parse(event.data);
            //handle sources
            if (response.hasOwnProperty('sources')) {
                sourcesContainer.style.display = "flex"
                sourcesContainer.querySelectorAll(".source-wrapper").forEach((wrapper, index) => {
                    if(index<response.sources.length){
                        source_data = response.sources[index];
                        wrapper.querySelector(".link").innerHTML = source_data.display;
                        wrapper.querySelector(".source-link").href = source_data.url;
                        wrapper.querySelector(".source-link").target = "_blank";
                        wrapper.querySelector(".sources-text.title").innerHTML = source_data.title;
                        wrapper.querySelector(".sources-text").innerHTML = source_data.preview;
                        wrapper.style.display = "block";
                    } else {
                        wrapper.style.display = "none";
                    }
                })
            } else {
                let data = response.message;
                if (data!=="[END MESSAGE]") {
                    destination.textContent += data;
                } else {
                    this.removeEventListener("message", receive);
                    //reset feedback bar
                    document.querySelector(".feedback-bar").style.display = "flex";
                    document.querySelector(".feedback-text").style.display = "none";
                    //update user words
                    var words = destination.textContent.split(" ").length;
                    document.querySelector("[customID='task-word-count']").innerHTML = `Word count: ${words}`;
                    updateUserWords(userWordCount+words);
                    //store task
                    var recentTasksContainer = document.querySelector("#recent-tasks");
                    storeTask(recentTasksContainer, {"prompt": `Write a(n) ${typeElement.value} about ${topicElement.value}`, "completion": destination.textContent, "sources": source_data});
                    var taskLength = recentTasksContainer.querySelectorAll(".module").length;
                    if(taskLength-1>5){
                        recentTasksContainer.querySelectorAll(".module")[taskLength-1].remove();
                    } 
                }
            }
        });
        socket.addEventListener("close", function handle_close() {
            clearInterval(waitingInterval);
            isWaiting = false;
            destination.textContent = "There was an error, please try again later. I apologise for the inconvenience.";
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

function submitQuestion(socket) {
    if(isWaiting){
        //if still waiting, do nothing
        return
    } else if(userWordCount > userMonthlyWords){
        document.querySelector("[customID='task-output']").textContent = "You have reached your maximum word limit for this month.\n\nUpgrade your plan to increase your limit."
        return
    }
    var form = document.querySelector("[customID='submit-question']");
    var questionElement = form.querySelector("[customInput='question']");
    var searchElement = form.querySelector("[customID='search-toggle']");
    //get ID of selected job
    var jobIndex = form.querySelector("[customID='user-job-list']").selectedIndex-1;
    if(jobIndex<=0||jobIndex>userJobs.length){
        var jobID = -1
    } else {
        var jobID = document.querySelectorAll("[customID='job-container']")[jobIndex].getAttribute("jobID");
    }
    //check if either typeElement or topic are missing
    var empty = [];
    if(questionElement.value===""){
        empty.push(questionElement);
    }
    var additionalElement = form.querySelector("[customInput='additional']");
    const data = {
        "name": userName,
        "member_id": member,
        "category": "question",
        "question": questionElement.value, 
        "additional": additionalElement.value,
        "search": searchElement.getAttribute("on")
    };
    //if neither type or topic element is missing
    if(empty.length==0){
        document.querySelector("[customID='question-word-count']").innerHTML = `Word count __`;

        var sourcesContainer = document.querySelector("[customID='question-sources-container']");
        if(searchElement.getAttribute("on")==="false"){
            sourcesContainer.style.display = "none";
        }

        var destination = document.querySelector("[customID='question-output']");
        waiting(destination);
        isWaiting = true;
        socket.addEventListener("message", function receive(event) {
            var source_data = [];
            if (isWaiting) {
                destination.textContent = "";
                clearInterval(waitingInterval);
                isWaiting = false;
            }
            let response = JSON.parse(event.data);
            //handle sources
            if (response.hasOwnProperty('sources')) {
                sourcesContainer.style.display = "flex"
                sourcesContainer.querySelectorAll(".source-wrapper").forEach((wrapper, index) => {
                    if(index<response.sources.length){
                        source_data = response.sources[index];
                        wrapper.querySelector(".link").innerHTML = source_data.display;
                        wrapper.querySelector(".source-link").href = source_data.url;
                        wrapper.querySelector(".source-link").target = "_blank";
                        wrapper.querySelector(".sources-text.title").innerHTML = source_data.title;
                        wrapper.querySelector(".sources-text").innerHTML = source_data.preview;
                        wrapper.style.display = "block";
                    } else {
                        wrapper.style.display = "none";
                    }
                })
            } else {
                let data = response.message;
                if (data!=="[END MESSAGE]") {
                    destination.textContent += data;
                } else {
                    this.removeEventListener("message", receive);
                    //reset feedback bar
                    document.querySelector(".feedback-bar").style.display = "flex";
                    document.querySelector(".feedback-text").style.display = "none";
                    //update user words
                    var words = destination.textContent.split(" ").length;
                    document.querySelector("[customID='question-word-count']").innerHTML = `Word count: ${words}`;
                    updateUserWords(userWordCount+words);
                    //store task
                    var recentQuestionContainer = document.querySelector("#recent-questions");
                    storeTask(recentQuestionContainer, {"prompt": questionElement.value, "completion": destination.textContent, "sources": source_data});
                    var taskLength = recentQuestionContainer.querySelectorAll(".module").length;
                    if(taskLength-1>5){
                        recentQuestionContainer.querySelectorAll(".module")[taskLength-1].remove();
                    } 
                }
            }
        });
        socket.addEventListener("close", function handle_close() {
            clearInterval(waitingInterval);
            isWaiting = false;
            destination.textContent = "There was an error, please try again later. I apologise for the inconvenience.";
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

document.addEventListener("DOMContentLoaded", () => {
    pageLoad();
    socket = new WebSocket(WEB_SOCKET_URL);

    socket.addEventListener('open', () => {
        //socket.send('Hello World!');
    });

    let tasks = ["task", "question", "rewrite", "idea"];
    document.querySelectorAll(".task-wrapper").forEach((wrapper, index) => {
        wrapper.querySelector(".generate-button").addEventListener("click", () => {
            if(socket.readyState !== WebSocket.CLOSED){
                if (tasks[index]==="task") {
                    submitTask(socket);
                } else if (tasks[index]==="idea") {
                    generateIdeas(socket);
                } else if (tasks[index]==="rewrite") {
                    submitRewrite(socket);
                } else if (tasks[index]=="question") {
                    submitQuestion(socket);
                }
            } else {
                socket = new WebSocket(WEB_SOCKET_URL);
                socket.addEventListener("open", () => {
                    if (tasks[index]==="task") {
                        submitTask(socket);
                    } else if (tasks[index]==="idea") {
                        generateIdeas(socket);
                    } else if (tasks[index]==="rewrite") {
                        submitRewrite(socket);
                    } else if (tasks[index]=="question") {
                        submitQuestion(socket);
                    }
                });
            }
        })
    })
});

setInterval(() => {
    //check if job is saved, save if not
    document.querySelectorAll("[customID='job-container']").forEach(jobElement => {
        if(jobElement.hasAttribute("saved")){
            if(jobElement.getAttribute("saved")==="false"){
                syncJob(jobElement);
            }
        }
    })
}, 60000)

const WEB_SERVER_BASE_URL = "https://virtuallyme2-0.onrender.com"
const WEB_SOCKET_URL = "wss://virtuallyme2-0.onrender.com/ws"
let isWaiting = false;

