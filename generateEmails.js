const startIndex = 1;
const endIndex = 100;
const batchLimit = 5;

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

const fillInput = (input, value) => {
    input.setAttribute('value', value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
};

const createEmail = async (emailName) => {
    let addBtn;
    let labelInput;
    let createNewEmailBtn;
    let backBtn;

    // click add button
    addBtn = document.getElementsByTagName('iframe')[0].contentWindow.document.querySelector('button[type="button"][title="Add"]');
    if (!addBtn) {
        addBtn = document.querySelector('.AddButton > button')
    }
    addBtn.click();
    await sleep(1000);

    // input label
    labelInput = document.getElementsByTagName('iframe')[0].contentWindow.document.getElementsByTagName("input")[0];
    if (!labelInput) {
        labelInput = document.getElementsByTagName("input")[0];
    }
    fillInput(labelInput, emailName);
    await sleep(1000);

    // click create new email
    createNewEmailBtn = document.getElementsByTagName('iframe')[0].contentWindow.document.getElementsByTagName("button")[2];
    if (!createNewEmailBtn) {
        createNewEmailBtn = document.getElementsByTagName("button")[2];
    }
    createNewEmailBtn.click();
    await sleep(5000);

    // click back button
    backBtn = document.getElementsByTagName('iframe')[0].contentWindow.document.getElementsByTagName("button")[1];
    if (!backBtn) {
        backBtn = document.getElementsByTagName("button")[1];
    }
    backBtn.click();
    await sleep(1000);
};

const start = async() => {
    let batchIndex = 1;
    for (let i = startIndex; i<=endIndex; i++) {
        await createEmail(i);
        
        console.log(`${i} - success, ${batchIndex}/${batchLimit}`)
        batchIndex++;

        if (batchIndex > batchLimit) {
            batchIndex = 1;
            console.log('Sleeping 2.2 hours');
            await sleep(1000 * 60 * 60 * 2.2); // 2.2 hours
        }
    }
}

await start();
console.log('Finished');
