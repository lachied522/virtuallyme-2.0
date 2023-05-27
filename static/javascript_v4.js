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

function waiting(element, text="Thinking") {
    element.textContent = text;
    var ellipsis = ". "
    return setInterval(() => {
        element.textContent = text + ellipsis;
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

function showAlertBanner(msg) {
    let banner = document.querySelector(".banner-wrapper.alert");
    banner.querySelector(".text-300").innerHTML = msg;

    banner.style.display = "block";

    banner.querySelector(".alert-banner-padding").animate([
        { opacity: '0' },
        { opacity: '1' }
    ], {
        duration: 300,
        easing: 'ease',
        fill: 'forwards'
    })

    banner.animate([
        { maxHeight: '0', opacity: '0' },
        { maxHeight: '100px', opacity: '1' }
    ], {
        duration: 400,
        easing: 'ease',
        fill: 'forwards'
    })

    setTimeout(() => {
        banner.animate([
            { maxHeight: '100px', opacity: '1' },
            { maxHeight: '0', opacity: '0' }
        ], {
            duration: 400,
            easing: 'ease',
            fill: 'forwards'
        })

        banner.querySelector(".alert-banner-padding").animate([
            { opacity: '1' },
            { opacity: '0' }
        ], {
            duration: 300,
            easing: 'ease',
            fill: 'forwards'
        })
    }, 5000);
}

function updateUserWords(value){
    userWordCount = value;
    document.querySelectorAll("[customID='user-word-count']").forEach(element => {
        element.innerHTML = userWordCount.toLocaleString();
    })
}

function detectGPT(container, score){
    if (score<0) {
        container.querySelector(".text-200.detection-text").innerHTML = `NA`;
    } else {
        container.querySelector(".text-200.detection-text").innerHTML = `${score}%`;
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

function updateJobWords(jobElement){
    let allSamples = jobElement.querySelectorAll("[customID='sample-text']");

    let totalWords = 0;
    allSamples.forEach(sample => {
        let text = sample.value;
        if (text!=="") {
            let words = text.trim().split(/\s+/).length;
            totalWords += words;
        }
    });

    jobElement.querySelector("[customID='job-word-count']").innerHTML = totalWords.toLocaleString();
    
    //progress bar logic
    let progressBar = jobElement.querySelector(".progress-bar-inner");
    let progressText = jobElement.querySelector(".text-300.progress-text");
    if (progressBar.classList.length>1) {
        progressBar.classList.remove(progressBar.classList[progressBar.classList.length-1]);
    }
    if (totalWords<=0) {
        jobElement.querySelector("[customID='samples-empty-text']").style.display = "block";
    }
    if (totalWords<1000) {
        progressBar.classList.add("stage-0");
        progressText.innerHTML = "";
        jobElement.querySelector("[customID='samples-empty-text']").style.display = "none";
        jobElement.querySelector(".share-button-wrapper").style.display = "none";
    } else if (totalWords<3000) {
        progressBar.classList.add("stage-1");
        progressText.innerHTML = "Not bad";
        jobElement.querySelector("[customID='samples-empty-text']").style.display = "none";
        jobElement.querySelector(".share-button-wrapper").style.display = "none";
    } else if (totalWords<6500) {
        progressBar.classList.add("stage-2");
        progressText.innerHTML = "Good";
        jobElement.querySelector("[customID='samples-empty-text']").style.display = "none";
        jobElement.querySelector(".share-button-wrapper").style.display = "none";
    } else if (totalWords<10000) {
        progressBar.classList.add("stage-3");
        progressText.innerHTML = "Great!";
        jobElement.querySelector("[customID='samples-empty-text']").style.display = "none";
        jobElement.querySelector(".share-button-wrapper").style.display = "none";
    } else {
        progressBar.classList.add("stage-4");
        progressText.innerHTML = "Excellent!";
        jobElement.querySelector("[customID='samples-empty-text']").style.display = "none";
        //show share button
        jobElement.querySelector(".share-button-wrapper").style.display = "inline";
        jobElement.querySelector(".share-tooltip").style.display = "none";
    }
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
    updateJobWords(jobElement);
    return jobElement
}

function newSample(jobElement, sampleWrapper, completion) {
    let sampleClone = sampleWrapper.parentElement.cloneNode(true);
    sampleClone.querySelector("[customID='sample-prompt-display']").innerHTML = completion.slice(0, 120);
    sampleClone.querySelector("[customID='sample-text']").innerHTML = completion;

    //add dynamic updating
    sampleClone.querySelector(".text-area.sample").addEventListener("change", () => {
        editSample(jobElement, sampleClone);
    });

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

function editSample(jobElement, sampleClone) {
    //update sample display
    let completion = sampleClone.querySelector(".text-area.sample").value;
    sampleClone.querySelector("[customID='sample-prompt-display']").innerHTML = completion.slice(0, 120);
    //show save button
    jobElement.querySelector("[customID='save-button']").style.display = "flex";
    jobElement.querySelector("[customID='saving-button']").style.display = "none";
    jobElement.querySelector("[customID='saved-button']").style.display = "none";
    //update job words
    updateJobWords(jobElement);
    //set saved attribute to false
    jobElement.setAttribute("saved", "false");
}

function storeTask(tasksContainer, data) {
    let module = tasksContainer.querySelectorAll(".module")[0];
    let taskClone = module.cloneNode(true);

    taskClone.querySelector("[customID='tasks-header']").innerHTML = data.prompt;
    taskClone.querySelector("[customID='tasks-body']").innerHTML = data.completion;
    
    if (data.hasOwnProperty('sources')) {
        taskClone.querySelectorAll(".link").forEach((link, index) => {
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
    if (data.hasOwnProperty('score')) {
        if (data.score!==null) {
            taskClone.querySelector(".detector-container");
            detectGPT(taskClone.querySelector(".detector-container"), data.score);
        }
    }
    if (data.hasOwnProperty('feedback')) {
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
        if (taskClone.hasAttribute("category")) {
            storeFeedback(taskClone, "positive");
        }
    });
    taskClone.querySelector(".feedback-button.negative").addEventListener("click", () => {
        feedbackAnimation(taskClone.querySelector(".feedback-bar"), "negative");
        sendFeedback(completion, "negative");
        if (taskClone.hasAttribute("category")) {
            storeFeedback(taskClone, "negative");
        }
    });
    taskClone.querySelector(".feedback-button.positive.clicked").addEventListener("click", () => {
        removeFeedbackAnimation(taskClone.querySelector(".feedback-bar"));
        sendFeedback(completion, "");
    });
    taskClone.querySelector(".feedback-button.negative.clicked").addEventListener("click", () => {
        removeFeedbackAnimation(taskClone.querySelector(".feedback-bar"));
        sendFeedback(completion, "");
    });
    taskClone.style.display = "block";
    module.after(taskClone);
    tasksContainer.querySelector("[customID='empty-text']").style.display = "none";
}


function storeComposition(tasksContainer, data) {
    let module = tasksContainer.querySelectorAll(".module")[0];
    let taskClone = module.cloneNode(true);

    taskClone.querySelector("[customID='tasks-header']").innerHTML = data.prompt;
    taskClone.querySelector("[customID='tasks-body']").innerHTML = data.completion;

    if (data.hasOwnProperty('score')) {
        if (data.score!==null) {
            score = data.score;
            detectGPT(taskClone.querySelector(".detector-container"), data.score);
        } else {
            detectGPT(taskClone.querySelector(".detector-container"), -1);
        }
    }

    taskClone.querySelector(".features-tasks-title-container").addEventListener("click", () => {
        featuresTaskOpen(taskClone);
    });

    taskClone.querySelector("[customID='continue-composition']").addEventListener("click", () => {
        editComposition(taskClone);
        taskClone.setAttribute("edit", "true");
    });

    taskClone.setAttribute("edit", "false"); //keep track of whether composition is currently being editted
    taskClone.style.display = "block";
    module.after(taskClone);
    tasksContainer.querySelector("[customID='empty-text']").style.display = "none";
}

function storeFeedback(module, feedback) {
    let taskClone = module.cloneNode(true);
    let category = module.getAttribute("category");
    taskClone.querySelector(".features-tasks-title-container").addEventListener("click", () => {
        featuresTaskOpen(taskClone);
    });
    taskClone.querySelector(".features-tasks-title-container").click();
    if(feedback==="positive"){
        feedbackAnimation(taskClone.querySelector(".feedback-bar"), "positive");
    } else if(feedback==="negative") {
        feedbackAnimation(taskClone.querySelector(".feedback-bar"), "negative");
    }
    //feedback button functionality
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
    if (category=="task") {
        let savedTasks = document.querySelector("#saved-tasks");
        savedTasks.insertBefore(taskClone, savedTasks.children[1]);
        savedTasks.querySelector("[customID='empty-text']").style.display = "none";
    } else if (category=="question") {
        let savedTasks = document.querySelector("#saved-questions");
        savedTasks.insertBefore(taskClone, savedTasks.children[1]);
        savedTasks.querySelector("[customID='empty-text']").style.display = "none";
    } else if (category=="rewrite") {
        let savedTasks = document.querySelector("#saved-rewrites");
        savedTasks.insertBefore(taskClone, savedTasks.children[1]);
        savedTasks.querySelector("[customID='empty-text']").style.display = "none";
    } else if (category=="idea") {
        let savedTasks = document.querySelector("#saved-ideas");
        savedTasks.insertBefore(taskClone, savedTasks.children[1]);
        savedTasks.querySelector("[customID='empty-text']").style.display = "none";
    }
}

function getUser(counter = 0){
    if(counter>=3){
        return
    } else {
        const url = `${WEB_SERVER_BASE_URL}/get_user/${member}`;
        fetch(url, {
            method: "GET"
        })
        .then(response => response.json())
        .then(data => {
            //store user description and about data
            if (data.description.length>0) {
                let descriptionWrapper = document.querySelector(".description-wrapper");
                descriptionWrapper.querySelector(".text-300").innerHTML = data.description;
                descriptionWrapper.style.display = "block";
                document.querySelector(".description-empty-text").style.display = "none";
                //hide welcome popup
                document.querySelector(".welcome-popup").remove();
            }
            //store task data
            for (let i = 0; i < data.tasks.length; i++) {
                if (i<5) {
                    storeTask(document.querySelector("#recent-tasks"), data.tasks[i]);
                } 
                if (data.tasks[i].feedback=="positive") {
                    storeTask(document.querySelector("#saved-tasks"), data.tasks[i]);
                }
            }
            //store questions data
            for (let i=0; i < data.questions.length; i++) {
                if (i<5) {
                    storeTask(document.querySelector("#recent-questions"), data.questions[i]);
                }
                if (data.questions[i].feedback==="positive") {
                    storeTask(document.querySelector("#saved-questions"), data.questions[i]);
                }
            }
            //store ideas data
            for (let i=0; i < data.ideas.length; i++) {
                if (i<5) {
                    storeTask(document.querySelector("#recent-ideas"), data.ideas[i]);
                }
                if (data.ideas[i].feedback==="positive") {
                    storeTask(document.querySelector("#saved-ideas"), data.ideas[i]);
                }
            }
            //store rewrite data
            for (let i = 0; i < data.rewrites.length; i++) {
                if (i<5) {
                    storeTask(document.querySelector("#recent-rewrites"), data.rewrites[i]);
                }
                if (data.rewrites[i].feedback==="positive") {
                    storeTask(document.querySelector("#saved-rewrites"), data.rewrites[i]);
                }
            }
            //store compositions
            for (let i = 0; i < data.compositions.length; i++) {
                if (i<5) {
                    storeComposition(document.querySelector("#recent-compositions"), data.compositions[i]);
                }
            }
            //update user word count
            updateUserWords(data.words);
            //hide preloader
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

function storeJobData(data) {
    //store job data
    for (let i=0; i < data.user.length; i++) {
        let newJobElement = newJob(data.user[i].name);
        //set job_id
        newJobElement.setAttribute("jobID", data.user[i].job_id);
        //store data
        let samplesGrid = newJobElement.querySelector(".samples-grid");
        let sampleWrapper = samplesGrid.querySelector(".sample-wrapper");
        for(let j=0; j < data.user[i].data.length; j++){
            samplesGrid.appendChild(newSample(newJobElement, sampleWrapper, data.user[i].data[j].completion));
        }
        updateJobWords(newJobElement);
        newJobElement.setAttribute("saved", "true");
    }
}

function syncJob(jobElement) {
    const url = `${WEB_SERVER_BASE_URL}/sync_job/${member}`;

    var sampleTexts = jobElement.querySelectorAll("[customID='sample-text']");

    let saveButton = jobElement.querySelector("[customID='save-button']");
    let savingButton = jobElement.querySelector("[customID='saving-button']");
    let savedButton = jobElement.querySelector("[customID='saved-button']");

    saveButton.style.display = "none";
    savingButton.style.display = "flex";
    savedButton.style.display = "none";

    var job = {
        "user_id": member, 
        "name": jobElement.querySelector("[customID='job-name']").value, 
        "id": jobElement.getAttribute("jobID")
    };

    var dataArray = [];
    for (let i = 0; i < sampleTexts.length; i++) {
        var text = sampleTexts[i].value;
        if(text !== ""){
            var data = {
                "completion": text
            }
            dataArray.push(data);
        }
    }
    job["data"]=dataArray;
    fetch(url, {
        method: "POST",
        body: JSON.stringify(job),
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
        const url = `${WEB_SERVER_BASE_URL}/create_job/${member}`
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
            body: JSON.stringify({"user_id": member, "name": newJobName}),
            headers: {
                "Content-Type": "application/json"
            },
        })
        .then(response => response.json())
        .then(data => {       
            var newJobElement = newJob(newJobName);
            updateJobWords(newJobElement);
            newJobElement.setAttribute("jobID", data.id);
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
        var currentWords = parseInt(wordCountElement.innerHTML);
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
            updateJobWords(jobElement);
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
    const url = `${WEB_SERVER_BASE_URL}/read_files`;
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB in bytes
    const accept = ["pdf", "docx"];
    const formData = new FormData();
    var fileSize = 0;
    for (let i = 0; i < files.length; i++) {
        let array = files[i].name.split(".");
        let size = files[i].size;
        if (accept.includes(array[array.length-1])) {
            if (size + fileSize < MAX_FILE_SIZE) {
                formData.append('files', files[i], files[i].name);
                fileSize += size;
            } else {
                showAlertBanner(`Please upload ${MAX_FILE_SIZE}MB maximum at a time`);
                return
            }
        } else {
            showAlertBanner('Please upload .docx or .pdf');
            return
        }
    }
    //show loading element
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
        for(let i=0; i<data.texts.length; i++){
            if (data.texts[i].includes("Unsupported filetype")) {
                showAlertBanner(data.texts[i]);
            } else if (data.texts[i].includes("Could not read file ")) {
                showAlertBanner(data.texts[i]);
            } else {
                samplesGrid.appendChild(newSample(jobElement, sampleWrapper, data.texts[i]));
            }
        }
        updateJobWords(jobElement);
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
    sampleWrapper.remove();
    //show save button
    jobElement.querySelector("[customID='save-button']").style.display = "flex";
    jobElement.querySelector("[customID='saving-button']").style.display = "none";
    jobElement.querySelector("[customID='saved-button']").style.display = "none";
    //adjust word count
    updateJobWords(jobElement);
    //set saved attribute to false
    jobElement.setAttribute("saved", "false");
}

function removeJob(jobElement){
    const job_id = jobElement.getAttribute("jobID");
    const url = `${WEB_SERVER_BASE_URL}/remove_job/${job_id}`;
    let body = {
        "user_id": member,
        "job_id": job_id
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

function shareJob(jobElement){
    //call sync function first
    //syncJob(jobNumber);
    const url = `${WEB_SERVER_BASE_URL}/share_job`;
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
    });
}


function removeSharedJob(id){
    const url = `${WEB_SERVER_BASE_URL}/remove_shared_job`
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

function searchToggle(searchElement) {
    if (searchElement.getAttribute("on")==="true") {
        searchElement.setAttribute("on", "false");
    } else {
        searchElement.setAttribute("on", "true");
    }
}

function sendFeedback(completion, feedback) {
    const url = `${WEB_SERVER_BASE_URL}/store_feedback/${member}`;
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
        }
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
            shareJob(jobElement);
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
}

function handleTask(socket, taskWrapper, data) {
    let waitingInterval = setInterval(() => {}, null); //initialise waiting interval
    let sources = [];

    let destination = taskWrapper.querySelector(".text-area.task-output");
    let sourcesContainer = taskWrapper.querySelector(".sources-container");

    if (sourcesContainer) {
        //hide sources container
        sourcesContainer.style.display = "none";
        sourcesContainer.querySelector(".search-error").style.display = "none"; //hide search error
    }

    taskWrapper.querySelector("[customID='word-count']").innerHTML = "__"; //reset word count

    let scoreElement = taskWrapper.querySelector("[customID='score']");
    if (scoreElement) {
        //reset score
        scoreElement.innerHTML = ""; 
    }

    if (data.search==="true") {
        //show searching animation
        var searchingInterval = waiting(destination, text="Searching");
        //add event listener to handle sources
        socket.addEventListener("message", function handleSources(event) {
            let response = JSON.parse(event.data);
            let message = response.message;

            if (message==="[SOURCES]" && response.sources.length>0) {
                sources = response.sources;
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
                });
            } else {
                //error generating the search
                sourcesContainer.querySelector(".search-error").style.display = "flex";
            }
            clearInterval(searchingInterval); //clear searching animation
            waitingInterval = waiting(destination, text="Thinking"); //show thinking animation
            this.removeEventListener("message", handleSources);
        });
    } else {
        //show thinking animation
        waitingInterval = waiting(destination, text="Thinking");
    }

    socket.addEventListener("message", function receive(event) {
        //handle main response
        let response = JSON.parse(event.data);
        let message = response.message;

        if (message==="[START MESSAGE]") {
            //clear thinking animation and empty textarea
            clearInterval(waitingInterval); 
            destination.textContent = "";
        } else if (message==="[SOURCES]") {
            //pass
        } else if (message==="[CANCELLED BY USER]") {
            //hide cancel button
            document.querySelector(".waiting-wrapper").classList.toggle("show"); 
            //show NA detection score
            detectGPT(scoreElement.parentElement, -1);
            //remove event listener
            this.removeEventListener("message", receive);

            if (waitingInterval) {
                //response was not yet recieved
                destination.textContent = "";
            } else {
                //partial response has been received
                //update user word count
                let words = destination.textContent.trim().split(" ").length;
                fetch(`${WEB_SERVER_BASE_URL}/update_user_words/${member}`, {
                    method: "POST",
                    body: JSON.stringify({"value": words}),
                    headers: {
                        "Content-Type": "application/json"
                    }
                })
                .then(response => {
                    updateUserWords(userWordCount+words);
                })
            }
            //clear waiting interval
            clearInterval(waitingInterval);
            isWaiting = false;
        } else if (message!=="[END MESSAGE]") {
            destination.textContent += message;
            destination.scrollTop = destination.scrollHeight; //scroll textarea down
        } else {
            isWaiting = false;
            //hide cancel task button
            document.querySelector(".waiting-wrapper").classList.toggle("show");
            
            this.removeEventListener("message", receive);
            //reset feedback bar
            document.querySelector(".feedback-bar").style.display = "flex";
            document.querySelector(".feedback-text").style.display = "none";
            //update user words
            let words = destination.textContent.trim().split(" ").length;
            taskWrapper.querySelector("[customID='word-count']").innerHTML = String(words);
            
            if (scoreElement) {
                //update detection score
                detectGPT(scoreElement.parentElement, response.score);
            }
            
            if (taskWrapper.querySelector(".task-options-buttons")) {
                //show task quick options buttons
                taskWrapper.querySelector(".task-options-buttons").style.display = "flex";
            }

            //update user words
            updateUserWords(userWordCount+words);
            //store task
            let category = data.category;
            let completion = destination.textContent.trim();

            if (category==="task") {
                var recentTasksContainer = document.querySelector("#recent-tasks");
                storeTask(recentTasksContainer, {"prompt": `Write a(n) ${data.type} about ${data.topic}`, "completion": completion, "score": response.score, "sources": sources});
            } else if (category==="question") {
                var recentTasksContainer = document.querySelector("#recent-questions");
                storeTask(recentTasksContainer, {"prompt": `${data.question}?`, "completion": completion, "score": response.score, "sources": sources});
            } else if (category==="rewrite") {
                var recentTasksContainer = document.querySelector("#recent-rewrites");
                storeTask(recentTasksContainer, {"prompt": `Rewrite: ${data.text.slice(0, 120)}...`, "completion": completion, "score": response.score});
            } else if (category==="idea") {
                var recentTasksContainer = document.querySelector("#recent-ideas");
                storeTask(recentTasksContainer, {"prompt": `Generate content ideas for my ${data.type} about ${data.topic}`, "completion": completion}); 
            }

            //only store 5 recent tasks
            let taskLength = recentTasksContainer.querySelectorAll(".module").length;
            if(taskLength-1>5){
                recentTasksContainer.querySelectorAll(".module")[taskLength-1].remove();
            } 
        }
    });
    socket.addEventListener("close", function handle_close() {
        if (isWaiting) {
            clearInterval(waitingInterval);
            isWaiting = false;
            destination.textContent = "There was an error generating your response. Please try again.";
        }
        this.removeEventListener("close", handle_close);
    });

    //add cancel event listener
    document.querySelector(".waiting-popup").addEventListener("click", () => {
        socket.send(JSON.stringify({"CANCEL": "[CANCEL TASK]"}));
    });

    //send data to websocket
    socket.send(JSON.stringify(data));
    //scroll output textarea into view
    destination.scrollIntoView({ behavior: "smooth", block: "center" });

    isWaiting = true;
}

function submitTask(socket, taskWrapper) {
    if(isWaiting){
        //if still waiting, do nothing
        return
    } else if(userWordCount > userMonthlyWords){
        taskWrapper.querySelector(".text-area.task-output").textContent = "You have reached your maximum word limit for this month.\n\nUpgrade your plan to increase your limit."
        return
    }

    let form = taskWrapper.querySelector(".task-input");
    let category = form.dataset.name;

    let data = {
        "member_id": member,
        "category": category
    }

    let formData = new FormData(form);
    let empty = [];
    for (const [key, value] of formData) {
        //check if required field is missing
        if (form.elements[key].required && value==="") {
            empty.push(form.elements[key]);
        }
        //get job_id
        if (key==="job") {
            var jobIndex = form.elements[key].selectedIndex-1;
            if(jobIndex<=0||jobIndex>userJobs.length){
                var jobID = -1
            } else {
                var jobID = document.querySelectorAll("[customID='job-container']")[jobIndex].getAttribute("jobID");
            }
            data["job_id"] = jobID;
        } else {
            data[key] = value;
        }
    }

    //get value of search toggle
    let searchElement = form.querySelector(".search-toggle");
    if (searchElement) {
        data["search"] = searchElement.getAttribute("on");
    } else {
        data["search"] = "false";
    }

    if(empty.length==0){
        //proceed with task
        handleTask(socket, taskWrapper, data);
        //show cancel task option
        document.querySelector(".waiting-wrapper").classList.toggle("show");
    } else {
        var originalColor = empty[0].style.borderColor;
        empty[0].style.borderColor = "#FFBEC2";
        setTimeout(function() {
            empty[0].style.borderColor = originalColor;
        }, 1500);
    }             
}

function appendText(text) {
    let composeOutput = document.querySelector("[customID='compose-output']");
    composeOutput.value += text;

    let optionsOutput = document.querySelector(".suggestions-container");
    optionsOutput.style.display = "none";

    let optionsContainers = optionsOutput.querySelectorAll(".option");
    optionsContainers.forEach((option, index) => {
        option.innerHTML = "Please wait. . .";
        if (!option.closest(".module").classList.contains("no-hover")) {
            option.closest(".module").classList.add("no-hover");
        } 
        option.parentElement.replaceWith(option.parentElement.cloneNode(true)); //remove event listeners
    });
    //update current word count
    let words = composeOutput.value.trim().split(" ").length;
    document.querySelector("[customID='compose-word-count']").innerHTML = words;
    
    //update user words 
    updateUserWords(userWordCount+words);

    if (words>50) {
        //update detection score
        let output = composeOutput.value;
        //detect gpt
        let url = `${WEB_SERVER_BASE_URL}/detect`;
        let data = {
            "text": String(output)
        }
        fetch(url, {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json"
            }
        })
        .then(response => response.text())
        .then(score => {
            detectGPT(document.querySelector("[customID='compose-score']").parentElement, score);
        })
    }
    //update DB
    let value = text.split(" ").length;
    let data = {
        "value": value
    }
    fetch(`${WEB_SERVER_BASE_URL}/update_user_words/${member}`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            "Content-Type": "application/json"
        }
    });
}


function replaceText(startPos, endPos, text) {
    //for rewriting compositions
    let composeOutput = document.querySelector("[customID='compose-output']");
    composeOutput.value = composeOutput.value.substring(0, startPos) + text + composeOutput.value.substring(endPos);

    let optionsOutput = document.querySelector(".suggestions-container");
    optionsOutput.style.display = "none";

    let optionsContainers = optionsOutput.querySelectorAll(".option");
    optionsContainers.forEach((option, index) => {
        option.innerHTML = "Please wait. . .";
        if (!option.closest(".module").classList.contains("no-hover")) {
            option.closest(".module").classList.add("no-hover");
        } 
        option.parentElement.replaceWith(option.parentElement.cloneNode(true)); //remove event listeners
    });
    
    //update current word count
    let words = composeOutput.value.trim().split(" ").length;
    document.querySelector("[customID='compose-word-count']").innerHTML = words;

    //update user words 
    updateUserWords(userWordCount+words);

    if (words>50) {
        //update detection score
        let output = composeOutput.value;
        //detect gpt
        let url = `${WEB_SERVER_BASE_URL}/detect`;
        let data = {
            "text": String(output)
        }
        fetch(url, {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json"
            }
        })
        .then(response => response.text())
        .then(score => {
            detectGPT(document.querySelector("[customID='compose-score']").parentElement, score);
        })
    }
    //update DB
    let value = text.split(" ").length;
    let data = {
        "value": value
    }
    fetch(`${WEB_SERVER_BASE_URL}/update_user_words/${member}`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            "Content-Type": "application/json"
        }
    });
}

function compose(socket, category) {
    if (isWaiting) {
        //if still waiting, do nothing
        return
    } else if(userWordCount > userMonthlyWords){
        showAlertBanner("You have reached your maximum word limit for this month");
        return
    }
    let form = document.querySelector("[customID='compose-input']");
    let typeElement = form.querySelector("[customInput='type']");
    let topicElement = form.querySelector("[customInput='topic']");

    var jobIndex = form.querySelector("[customID='user-job-list']").selectedIndex-1;
    if (jobIndex<0||jobIndex>userJobs.length) {
        var jobID = -1
    } else {
        var jobID = document.querySelectorAll("[customID='job-container']")[jobIndex].getAttribute("jobID");
    }
    
    let textElement = document.querySelector("[customID='compose-output']");

    //check if either typeElement or topic are missing
    var empty = [];
    if (typeElement.value==="") {
        empty.push(typeElement);
    } else if (topicElement.value==="") {
        empty.push(topicElement);
    }
    if (empty.length===0) {
        isWaiting = true;
        if (category==="rewrite") {
            var extract = window.getSelection().toString(); //piece of text to be rewritten
            if (extract.length===0) {
                if (document.querySelector(".compose-overlay").classList.contains("hidden")) {
                    //show overlay
                    document.querySelector(".compose-overlay").classList.remove("hidden");
                    document.querySelector(".compose-overlay").classList.add("show");
                    //remove style attributes assigned by Webflow animation
                    document.querySelector(".compose-overlay").removeAttribute("style");
                }
                return
            } else {
                var startPos = textElement.selectionStart;
                var endPos = textElement.selectionEnd;
                var data = {
                    "member_id": member,
                    "job_id": jobID,
                    "category": category,
                    "type": typeElement.value, 
                    "topic": topicElement.value,
                    "text": textElement.value,
                    "extract": extract,
                    "compose": "true"
                }
            }
        } else {
            var data = {
                "member_id": member,
                "job_id": jobID,
                "category": category,
                "type": typeElement.value, 
                "topic": topicElement.value,
                "text": textElement.value,
                "compose": "true"
            }
        }
        //hide overlay
        if (document.querySelector(".compose-overlay").classList.contains("show")) {
            document.querySelector(".compose-overlay").classList.remove("show");
            document.querySelector(".compose-overlay").classList.add("hidden");
        }
        //reset options elements
        let optionsOutput = document.querySelector(".suggestions-container");
        let optionsContainers = optionsOutput.querySelectorAll(".option");
        optionsContainers.forEach((option, index) => {
            option.innerHTML = "Please wait. . .";
            if (!option.closest(".module").classList.contains("no-hover")) {
                option.closest(".module").classList.add("no-hover");
            } 
        });
        //display options container
        optionsOutput.style.display = "flex";
        socket.addEventListener("message", function receive(event) {
            let response = JSON.parse(event.data);
            let data = response.message;
            if (data==="[START MESSAGE]") {
                optionsContainers.forEach((option, index) => {
                    option.innerHTML = "";
                });
            } else if (data==="[CANCELLED BY USER]") {
                isWaiting = false;
                document.querySelector(".waiting-wrapper").classList.toggle("show"); //hide cancel button
                this.removeEventListener("message", receive);
            } else if (data!=="[END MESSAGE]") {
                let index = response.index;
                optionsContainers[index].innerHTML += data;
            } else {
                isWaiting = false;
                this.removeEventListener("message", receive);
                optionsContainers.forEach((option, index) => {
                    option.closest(".module").classList.remove("no-hover");
                    option.parentElement.addEventListener("click", function select() {
                        let text = option.innerHTML;
                        if (category!=="rewrite") {
                            appendText(text);
                        } else {
                            replaceText(startPos, endPos, text);
                        }
                    })
                });
            }
        });

        //add cancel event listener
        document.querySelector(".waiting-popup").addEventListener("click", () => {
            socket.send(JSON.stringify({"CANCEL": "[CANCEL TASK]"}));
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

function editComposition(module) {
    let prompt = module.querySelector("[customID='tasks-header']").innerHTML;
    let text = module.querySelector("[customID='tasks-body']").innerHTML;

    if (document.querySelector(".compose-overlay").classList.contains("show")) {
        //hide overlay
        document.querySelector(".compose-overlay").classList.remove("show");
        document.querySelector(".compose-overlay").classList.add("hidden");
    };

    //save existing composition if there is one
    let textElement = document.querySelector("[customID='compose-output']");
    if (textElement.value.length>0) {
        saveComposition();
        textElement.value = text;
    } else {
        textElement.value = text;
    }

    //scroll output to middle of screen
    textElement.scrollIntoView({ behavior: "smooth", block: "center" });
        
    //extract type and topic from prompt
    let regex = /Write a\(n\)\s+(.+)\s+about\s+(.+)/i; //i makes regex case-insensitive
    let match = prompt.match(regex);

    if (match) {
        let type = match[1];
        let topic = match[2];

        let form = document.querySelector("[customID='compose-input']");
        let typeElement = form.querySelector("[customInput='type']");
        let topicElement = form.querySelector("[customInput='topic']");
        
        typeElement.value = type;
        topicElement.value = topic;
    }
    //update word count
    let words = text.trim().split(/\s+/).length;
    document.querySelector("[customID='compose-word-count']").innerHTML = words;

    //get score
    let scoreContainer = module.querySelector(".detector-container");
    let score = scoreContainer.querySelector(".text-200.detection-text").innerHTML;

    if (parseFloat(score)) {
        detectGPT(document.querySelector("[customID='compose-score']").parentElement, parseFloat(score));
    } else {
        //pass
    }

    if (module.getAttribute("category")==="compose") {
        //set edit attribute to true
        module.setAttribute("edit", "true");
    }
    //show compose dropdown in case it is not already shown
    document.querySelector(".compose-dropdown").style.display = "block";
}

function removeComposition(module) {
    let text = module.querySelector("[customID='tasks-body']").innerHTML;
    //remove task from DB
    let data = {
        "text": text
    }
    fetch(`${WEB_SERVER_BASE_URL}/remove_task/${member}`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            "Content-Type": "application/json"
        }
    });
    //remove module
    module.remove();
}

function saveComposition() {
    let form = document.querySelector("[customID='compose-input']");
    let typeElement = form.querySelector("[customInput='type']");
    let topicElement = form.querySelector("[customInput='topic']");   
    
    var jobIndex = form.querySelector("[customID='user-job-list']").selectedIndex-1;
    if(jobIndex<0||jobIndex>userJobs.length){
        var jobID = -1
    } else {
        var jobID = document.querySelectorAll("[customID='job-container']")[jobIndex].getAttribute("jobID");
    }

    let textElement = document.querySelector("[customID='compose-output']");

    let prompt = `Let's write a(n) ${typeElement.value} about ${topicElement.value}`;
    let completion = textElement.value;

    //reset input elements
    typeElement.value = "";
    topicElement.value = "";
    textElement.value = "";

    //reset word count
    document.querySelector("[customID='compose-word-count']").innerHTML = 0;

    //hide suggestions container
    document.querySelector(".suggestions-container").style.display = "none";

    let recentCompositions = document.querySelector("[customID='recent-compositions']");
    let modules = recentCompositions.querySelectorAll(".module");
    for (let i=0; i<modules.length; i++) {
        if (modules[i].getAttribute("edit")==="true") {
            //remove composition
            removeComposition(modules[i]);
        }
    }

    //get current score
    let scoreContainer = document.querySelector("[customID='compose-score']");
    scoreContainer.parentElement.style.display = "none";
    let score = scoreContainer.innerHTML;
    //check if score has been calculated
    if (parseFloat(score)) {
        //store new composition
        storeComposition(recentCompositions, {"prompt": prompt, "completion": completion, "score": parseFloat(score)});
        
    } else {
        //store new composition
        storeComposition(recentCompositions, {"prompt": prompt, "completion": completion, "score": -1});
    }

    //save composition in DB
    let body = {
        "member_id": member,
        "category": "composition",
        "prompt": prompt,
        "completion": completion,
        "score": parseFloat(score) || -1,
        "job_id": jobID
    }
    fetch(`${WEB_SERVER_BASE_URL}/store_task/${member}`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json"
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    pageLoad();

    socket = new WebSocket(WEB_SOCKET_URL);

    socket.addEventListener("message", function loadData(event) {
        let data = JSON.parse(event.data);
        storeJobData(data);
        socket.removeEventListener("message", loadData);
    });

    document.querySelectorAll(".task-wrapper").forEach((wrapper, index) => {
        wrapper.querySelector(".generate-button").addEventListener("click", () => {
            if(socket.readyState !== WebSocket.CLOSED){
                submitTask(socket, wrapper);
            } else {
                socket = new WebSocket(WEB_SOCKET_URL);
                socket.addEventListener("open", () => {
                    submitTask(socket, wrapper);
                });
            }
        })
    });
    
    let compose_array = ["sentence", "paragraph", "rewrite"];
    document.querySelectorAll(".compose-button").forEach((button, index) => {
        button.addEventListener("click", () => {
            if (socket.readyState !== WebSocket.CLOSED) {
                compose(socket, compose_array[index]);
            } else {
                socket = new WebSocket(WEB_SOCKET_URL);
                socket.addEventListener("open", () => {
                    compose(socket, compose_array[index]);
                });
            }
        });
    });

    //dynamic word counter for compose task
    document.querySelector("[customID='compose-output']").addEventListener("input", () => {
        let text = document.querySelector("[customID='compose-output']").value;
        let words = text.trim().split(/\s+/).length;
        document.querySelector("[customID='compose-word-count']").innerHTML = words;
    });

    //hide compose overlay when user makes selection
    document.querySelector("[customID='compose-output']").addEventListener("focus", () => {
        if (document.querySelector(".compose-overlay").classList.contains("show")) {
            document.querySelector(".compose-overlay").classList.remove("show");
            document.querySelector(".compose-overlay").classList.add("hidden");
        }
    });

    //compose funcitonality
    document.querySelector("[customID='new-composition']").addEventListener("click", () => {
        let form = document.querySelector("[customID='compose-input']");
        let typeElement = form.querySelector("[customInput='type']");
        let topicElement = form.querySelector("[customInput='topic']");
        var empty = [];
        if (typeElement.value==="") {
            empty.push(typeElement);
        } else if (topicElement.value==="") {
            empty.push(topicElement);
        } 
        if (empty.length===0) {
            document.querySelector(".compose-dropdown").style.display = "block";
        } else {
            var originalColor = empty[0].style.borderColor;
            empty[0].style.borderColor = "#FFBEC2";
            setTimeout(function() {
                empty[0].style.borderColor = originalColor;
            }, 1500);
            return
        }        
    });

    document.querySelector("[customID='compose-save-button']").addEventListener("click", () => {
        if (!isWaiting) {
            saveComposition();
        }
    }); 

    document.querySelector("[customID='task-to-compose']").addEventListener("click", () => {
        if (isWaiting) {
            return
        } else {
            let recentTasksContainer = document.querySelector("#recent-tasks");
            editComposition(recentTasksContainer.querySelectorAll(".module")[1]); //get most recent task
        }
    });

    document.querySelector("[customID='task-to-rewrite']").addEventListener("click", () => {
        if (isWaiting) {
            return
        } else {
            let text = document.querySelector("[customID='task-output']").value;
            let form = document.querySelector("[customID='submit-rewrite']");
            form.querySelector("[customInput='text']").value = text;
            form.querySelector("[customInput='text']").scrollIntoView({ behavior: "smooth", block: "center" });
        }
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
    }, 60000);
});

const WEB_SOCKET_URL = `wss://virtuallyme2-0.onrender.com/ws/${member}`;
const WEB_SERVER_BASE_URL = "https://virtuallyme2-0.onrender.com";
let isWaiting = false;
