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
        //show banner for five seconds
        //banner.querySelector(".alert-banner-close-icon").click();
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
    if (totalWords<=1000) {
        progressBar.classList.add("stage-0");
        progressText.innerHTML = "";
        jobElement.querySelector("[customID='samples-empty-text']").style.display = "none";
    } else if (totalWords<=3000) {
        progressBar.classList.add("stage-1");
        progressText.innerHTML = "Not bad";
        jobElement.querySelector("[customID='samples-empty-text']").style.display = "none";
    } else if (totalWords<=6500) {
        progressBar.classList.add("stage-2");
        progressText.innerHTML = "Good";
        jobElement.querySelector("[customID='samples-empty-text']").style.display = "none";
    } else if (totalWords<=1000) {
        progressBar.classList.add("stage-3");
        progressText.innerHTML = "Great!";
        jobElement.querySelector("[customID='samples-empty-text']").style.display = "none";
    } else {
        progressBar.classList.add("stage-4");
        progressText.innerHTML = "Excellent!";
        jobElement.querySelector("[customID='samples-empty-text']").style.display = "none";
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
        const url = `${WEB_SERVER_BASE_URL}/get_user/${String(member)}`;
        fetch(url, {
            method: "GET",
            headers: {},
        })
        .then(response => response.json())
        .then(data => {
            //hide preloader
            hidePreloader();
            //store user description and about data
            if(data.description.length>0){
                let descriptionWrapper = document.querySelector(".description-wrapper");
                descriptionWrapper.querySelector(".text-300").innerHTML = data.description;
                descriptionWrapper.style.display = "block";
                document.querySelector(".description-empty-text").style.display = "none";
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
                updateJobWords(newJobElement);
                newJobElement.setAttribute("saved", "true");
            }
            if (data.user.length>0||data.words>0) {
                //hide welcome popup
                document.querySelector(".welcome-popup").remove();
            }
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
            updateJobWords(newJobElement);
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
    const url = "https://virtuallyme.onrender.com/read_files";
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB in bytes
    const accept = ["pdf", "docx"];
    const formData = new FormData();
    var fileSize = 0;
    for (let i = 0; i < files.length; i++) {
        let array = files[i].name.split(".");
        let size = files[i].size;
        if (accept.includes(array[array.length-1])) {
            if (size + fileSize < MAX_FILE_SIZE) {
                formData.append('file', files[i], files[i].name);
                fileSize += size;
            } else {
                showAlertBanner(`Please upload ${MAX_FILE_SIZE}MB maximum at a time`);
            }
        } else {
            showAlertBanner('Please upload .docx or .pdf');
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

function share(jobElement, counter = 0){
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
        document.querySelector("[customID='idea-word-count']").innerHTML = `__`;
        var destination = document.querySelector("[customID='ideas-output']");
        //bring destination to center of screen
        destination.scrollIntoView({ behavior: "smooth", block: "center" });
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
                //update user words
                var words = destination.textContent.split(" ").length;
                document.querySelector("[customID='idea-word-count']").innerHTML = `${words}`;
                updateUserWords(userWordCount+words);
                //store task
                var recentIdeasContainer = document.querySelector("#recent-ideas");
                storeTask(recentIdeasContainer, {"prompt": `Generate content ideas for my ${typeElement.value} about ${topicElement.value}`, "completion": destination.textContent.split()}); 
                var taskLength = recentIdeasContainer.querySelectorAll(".module").length;
                if(taskLength-1>5){
                    recentIdeasContainer.querySelectorAll(".module")[taskLength-1].remove();
                } 
            }
        });
        socket.addEventListener("close", function handle_close()  {
            if (isWaiting) {
                clearInterval(waitingInterval);
                isWaiting = false;
                destination.textContent = "There was an error generating your response. Please try again.";
            }
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
        document.querySelector("[customID='rewrite-word-count']").innerHTML = "__";
        document.querySelector("[customID='rewrite-score']").innerHTML = "";
        var destination = document.querySelector("[customID='rewrite-output']");
        //bring destination to center of screen
        destination.scrollIntoView({ behavior: "smooth", block: "center" });
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
                //update user words
                let words = destination.textContent.trim().split(" ").length;
                document.querySelector("[customID='rewrite-word-count']").innerHTML = `${words}`;
                //update detection score
                detectGPT(document.querySelector("[customID='rewrite-score']").parentElement, response.score);
                //update user words
                updateUserWords(userWordCount+words);
                //store task
                var rewritesContainer = document.querySelector("#recent-rewrites");
                storeTask(rewritesContainer, {"prompt": `Rewrite: ${textElement.value.slice(0, 120)}...`, "completion": destination.textContent, "score": response.score});
                var taskLength = rewritesContainer.querySelectorAll(".module").length;
                if(taskLength-1>5){
                    rewritesContainer.querySelectorAll(".module")[taskLength-1].remove();
                } 
            }
        });
        socket.addEventListener("close", function handle_close()  {
            if (isWaiting) {
                clearInterval(waitingInterval);
                isWaiting = false;
                destination.textContent = "There was an error generating your response. Please try again.";
            }
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

function searchToggle(searchElement) {
    if (searchElement.getAttribute("on")==="true") {
        searchElement.setAttribute("on", "false");
    } else {
        searchElement.setAttribute("on", "true");
    }
}

function sendFeedback(completion, feedback) {
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
    var lengthElement = form.querySelector("[customID='output-length']");
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
        "length": lengthElement.value,
        "search": searchElement.getAttribute("on")
    };
    //if neither type or topic element is missing
    if(empty.length==0){
        document.querySelector("[customID='task-word-count']").innerHTML = "__";

        var sourcesContainer = document.querySelector("[customID='task-sources-container']");
        if(searchElement.getAttribute("on")==="false"){
            sourcesContainer.style.display = "none";
        }
        document.querySelector("[customID='task-score']").innerHTML = "";
        var destination = document.querySelector("[customID='task-output']");
        //bring destination to center of screen
        destination.scrollIntoView({ behavior: "smooth", block: "center" });
        //start waiting animation
        waiting(destination);
        isWaiting = true;
        var source_data = [];
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
                document.querySelector(".feedback-bar").style.display = "flex";
                document.querySelector(".feedback-text").style.display = "none";
                //update user words
                let words = destination.textContent.trim().split(" ").length;
                document.querySelector("[customID='task-word-count']").innerHTML = String(words);
                //update detection score
                detectGPT(document.querySelector("[customID='task-score']").parentElement, response.score);
                //update user words
                updateUserWords(userWordCount+words);
                //handle sources
                const recentTasksContainer = document.querySelector("#recent-tasks");
                if (response.hasOwnProperty('sources')) {
                    const sources = response.sources;
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
                    storeTask(recentTasksContainer, {"prompt": `Write a(n) ${typeElement.value} about ${topicElement.value}`, "completion": destination.textContent, "score": response.score, "sources": sources});
                } else {
                    storeTask(recentTasksContainer, {"prompt": `Write a(n) ${typeElement.value} about ${topicElement.value}`, "completion": destination.textContent, "score": response.score, "sources": []});
                }
                var taskLength = recentTasksContainer.querySelectorAll(".module").length;
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
        "job_id": jobID, 
        "question": questionElement.value, 
        "additional": additionalElement.value,
        "search": searchElement.getAttribute("on")
    };
    //if neither type or topic element is missing
    if (empty.length==0) {
        document.querySelector("[customID='question-word-count']").innerHTML = "__";
        document.querySelector("[customID='question-score']").innerHTML = "";

        var sourcesContainer = document.querySelector("[customID='question-sources-container']");
        if(searchElement.getAttribute("on")==="false"){
            sourcesContainer.style.display = "none";
        }

        var destination = document.querySelector("[customID='question-output']");
        destination.scrollIntoView({ behavior: "smooth", block: "center" });
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
                //update user words
                let words = destination.textContent.trim().split(" ").length;
                document.querySelector("[customID='question-word-count']").innerHTML = String(words);
                //update detection score
                detectGPT(document.querySelector("[customID='question-score']").parentElement, response.score);
                //update user words
                updateUserWords(userWordCount+words);
                //store task
                var recentQuestionContainer = document.querySelector("#recent-questions");
                if (response.hasOwnProperty('sources')) {
                    //handle sources
                    const sources = response.sources;
                    sourcesContainer.style.display = "flex";
                    sourcesContainer.querySelectorAll(".source-wrapper").forEach((wrapper, index) => {
                        if (index<response.sources.length) {
                            let source_data = response.sources[index];
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
                    storeTask(recentQuestionContainer, {"prompt": questionElement.value, "completion": destination.textContent, "score": response.score, "sources": sources});
                } else {
                    storeTask(recentQuestionContainer, {"prompt": questionElement.value, "completion": destination.textContent, "score": response.score, "sources": []});
                }

                var taskLength = recentQuestionContainer.querySelectorAll(".module").length;
                if(taskLength-1>5){
                    recentQuestionContainer.querySelectorAll(".module")[taskLength-1].remove();
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



function appendText(text) {
    document.querySelector(".compose-output").value += text;

    let optionsOutput = document.querySelector(".suggestions-container");
    optionsOutput.style.display = "none";

    let optionsContainers = optionsOutput.querySelectorAll(".option");
    optionsContainers.forEach(element => {
        element.innerHTML = "Please wait. . .";
        element.parentElement.replaceWith(element.parentElement.cloneNode(true)); //remove event listeners
    });
    
    //update current word count
    let composeOutput = document.querySelector(".compose-output");
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
        "member_id": member,
        "value": value
    }
    fetch("https://virtuallyme.onrender.com/update_user_words", {
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
        option.parentElement.replaceWith(element.parentElement.cloneNode(true)); //remove event listeners
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
        console.log(data);
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
        "member_id": member,
        "value": value
    }
    fetch("https://virtuallyme.onrender.com/update_user_words", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            "Content-Type": "application/json"
        }
    });
}


function compose(socket, request) {
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
        if (request==="rewrite") {
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
                    "request": request,
                    "type": typeElement.value, 
                    "topic": topicElement.value,
                    "text": textElement.value,
                    "extract": extract
                }
            }
        } else {
            var data = {
                "member_id": member,
                "job_id": jobID,
                "request": request,
                "type": typeElement.value, 
                "topic": topicElement.value,
                "text": textElement.value
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
            } else if (data!=="[END MESSAGE]") {
                let index = response.index;
                optionsContainers[index].innerHTML += data;
            } else {
                isWaiting = false;
                this.removeEventListener("message", receive);
                optionsContainers.forEach((option, index) => {
                    option.closest(".module").classList.remove("no-hover");
                    option.parentElement.addEventListener("click", function select() {
                        option.parentElement.removeEventListener("click", select); //remove any existing event listeners
                        let text = option.innerHTML;
                        if (request!=="rewrite") {
                            appendText(text);
                        } else {
                            replaceText(startPos, endPos, text);
                        }
                    })
                });
            }
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

    //set edit attribute to true
    module.setAttribute("edit", "true");
    //show compose dropdown in case it is not already shown
    document.querySelector(".compose-dropdown").style.display = "block";
}

function removeComposition(module) {
    let text = module.querySelector("[customID='tasks-body']").innerHTML;
    //remove task from DB
    data = {
        "member_id": member,
        "completion": text
    }
    fetch("https://virtuallyme.onrender.com/remove_task", {
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
    fetch("https://virtuallyme.onrender.com/store_task", {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json"
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    pageLoad();
    const WEB_SOCKET_URL = "wss://virtuallyme2-0.onrender.com/ws";
    socket = new WebSocket(WEB_SOCKET_URL);

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
    });

    const COMPOSE_SOCKET_URL = "wss://virtuallyme2-0.onrender.com/compose";
    let composeSocket = new WebSocket(COMPOSE_SOCKET_URL);
    
    let requests = ["sentence", "paragraph", "rewrite"];
    document.querySelectorAll(".compose-button").forEach((button, index) => {
        button.addEventListener("click", () => {
            if (composeSocket.readyState !== WebSocket.CLOSED) {
                compose(composeSocket, requests[index]);
            } else {
                composeSocket = new WebSocket(COMPOSE_SOCKET_URL);
                composeSocket.addEventListener("open", () => {
                    compose(composeSocket, requests[index]);
                })
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
        saveComposition();
    }); 
});

setInterval(() => {
    //check if job is saved, save if not
    document.querySelectorAll("[customID='job-container']").forEach((jobElement, index) => {
        if(jobElement.hasAttribute("saved")){
            if(jobElement.getAttribute("saved")==="false"){
                syncJob(jobElement);
            }
        }
        //update job name
        let jobTabButton = document.querySelectorAll(".job-tab")[index];
        if (jobTabButton.innerHTML!=jobElement.querySelector("[customID='job-name']").value) {
            jobTabButton.innerHTML = jobElement.querySelector("[customID='job-name']").value;
        }
    })
}, 60000)

const WEB_SERVER_BASE_URL = "https://virtuallyme2-0.onrender.com";
let isWaiting = false;
