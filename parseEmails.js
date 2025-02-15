const getEmailsData = () => {
    let emailsLines = document.querySelector('iframe')?.contentWindow?.document
        ?.querySelector(".CardList")?.querySelectorAll("li");

    if (!emailsLines || emailsLines.length === 0) {
        emailsLines = document.querySelectorAll('.CardList > li');
    }

    const emailsData = new Map();

    for (const data of emailsLines) {
        const emailName = data.querySelector("h2")?.innerText.trim();
        const emailAddress = data.querySelector("span.searchable-card-subtitle")?.innerText.trim();

        if (emailName && emailAddress) {
            if (!emailsData.has(emailName)) {
                emailsData.set(emailName, []);
            }
            emailsData.get(emailName).push(emailAddress);
        }
    }

    return emailsData;
};

const emailsData = getEmailsData();

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

if (emailsData.size > 0) {
    const emailsDataString = [...emailsData.entries()]
        .sort(([a], [b]) => collator.compare(a, b))
        .map(([label, emails]) => emails.map(email => `${label}:${email}`).join("\n"))
        .join('\n');

    copy(emailsDataString);
    console.log("Emails copied to clipboard!");
} else {
    console.warn("No email data found.");
}
