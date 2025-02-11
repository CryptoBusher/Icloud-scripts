const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fillInput = (input, value) => {
    if (input) {
        input.setAttribute('value', value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
        console.error('fillInput: Input element not found');
    }
};

const getEmailsData = () => {
    let emailsLines = document.querySelector('iframe')?.contentWindow?.document
        ?.querySelector(".CardList")?.querySelectorAll("li");

    if (!emailsLines || emailsLines.length === 0) {
        emailsLines = document.querySelectorAll('.CardList > li');
    }

    const emailsData = {};
    const numericNames = new Set();

    for (const data of emailsLines) {
        const emailName = data.querySelector("h2")?.innerText.trim();
        const emailAddress = data.querySelector("span.searchable-card-subtitle")?.innerText.trim();

        if (emailName && emailAddress) {
            emailsData[emailName] = emailAddress;

            if (/^\d+$/.test(emailName)) {
                numericNames.add(parseInt(emailName, 10));
            }
        }
    }

    return { emailsData, numericNames };
};

const getNextName = () => {
    const { numericNames } = getEmailsData();

    if (numericNames.size === 0) return 1;

    const sortedNumbers = [...numericNames].sort((a, b) => a - b);

    for (let i = 1; i <= sortedNumbers[sortedNumbers.length - 1]; i++) {
        if (!numericNames.has(i)) {
            return i;
        }
    }

    return sortedNumbers[sortedNumbers.length - 1] + 1;
};

const createEmail = async (emailName) => {
    const iframeDoc = document.querySelector('iframe')?.contentWindow?.document || document;

    let addBtn = iframeDoc.querySelector('button[title="Add"]') || document.querySelector('.AddButton > button');
    if (addBtn) {
        addBtn.click();
        await sleep(1000);
    } else {
        throw new Error('add button not found');
    }

    let labelInput = iframeDoc.querySelector("input");
    if (labelInput) {
        fillInput(labelInput, emailName);
        await sleep(1000);
    } else {
        throw new Error('label input not found');
    }

    let createNewEmailBtn = iframeDoc.querySelectorAll("button")[2];
    if (createNewEmailBtn) {
        createNewEmailBtn.click();
        await sleep(5000);
    } else {
        throw new Error('create new email button not found');
    }

    let backBtn = iframeDoc.querySelectorAll("button")[1];
    if (backBtn) {
        backBtn.click();
        await sleep(5000);
    } else {
        throw new Error('back button not found');
    }
};

const start = async () => {
    while (true) {
        for (let i = 0; i < 5; i++) {
            try {
                const name = getNextName();
                console.log(`${name} - registering`);
                await createEmail(name);
                console.log(`${name} - email registered`);
            } catch (e) {
                console.error(`Failed to register email, reason: ${e.message}`);
            }
        }

        console.log('Sleeping 1.1 hours...');
        await sleep(1000 * 60 * 60 * 1.1); // 1.1 hours
    }
};

await start();
