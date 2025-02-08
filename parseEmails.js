const getEmailsData = () => {
    let emailsLines = document.querySelector('iframe')?.contentWindow?.document
        ?.querySelector(".CardList")?.querySelectorAll("li");

    if (!emailsLines || emailsLines.length === 0) {
        emailsLines = document.querySelectorAll('.CardList > li');
    }

    const emailsData = {};

    for (const data of emailsLines) {
        const emailName = data.querySelector("h2")?.innerText.trim();
        const emailAddress = data.querySelector("span.searchable-card-subtitle")?.innerText.trim();

        if (emailName && emailAddress) {
            emailsData[emailName] = emailAddress;
        }
    }

    return emailsData;
};

const emailsData = getEmailsData();

if (Object.keys(emailsData).length > 0) {
    const emailsDataString = Object.entries(emailsData)
        .map(([key, value]) => `${key}:${value}`)
        .join('\n');

    copy(emailsDataString);
    console.log("Emails copied to clipboard!");
} else {
    console.warn("No email data found.");
}
