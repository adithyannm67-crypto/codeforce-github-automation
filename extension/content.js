document.addEventListener("submit", (event) => {
    const form = event.target;

    if (!form.matches("form.submit-form.submitFrameForm")) {
        return;
    }

    const formData = new FormData(form);

    const submissionData = {
        problemCode: formData.get("submittedProblemCode"),
        languageId: formData.get("programTypeId"),
        source: formData.get("source")
    };

    chrome.runtime.sendMessage({
        action: "SUBMISSION_DATA",
        data: submissionData
    });
}, true);