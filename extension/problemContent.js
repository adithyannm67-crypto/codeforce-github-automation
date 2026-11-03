const problem = document.querySelector(".problem-statement");

if (problem) {
const url= window.location.href;
    const problemData = {
        problemCode: url.split("/").slice(-2).join(""),
        title: problem.querySelector(".header .title")?.innerText.trim(),
        statement: problem.innerText.trim(),
        url: url
    };

    chrome.runtime.sendMessage({
        action: "PROBLEM_DATA",
        data: problemData
    });
}