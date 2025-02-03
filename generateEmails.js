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

let batchIndex = 1;
for (let i = startIndex; i<=endIndex; i++) {
    let addBtn = document.querySelector('.AddButton > button')
    addBtn.click();
    await sleep(1000);

    let labelInput = document.getElementsByTagName("input")[0];
    fillInput(labelInput, i);
    await sleep(1000); 

    let createNewEmailBtn = document.getElementsByTagName("button")[2];
    createNewEmailBtn.click();
    await sleep(5000);

    let backBtn = document.getElementsByTagName("button")[1];
    backBtn.click();
    await sleep(1000);
    
    console.log(`${i} - success, ${batchIndex}/${batchLimit}`)
    batchIndex++;

    if (batchIndex > batchLimit) {
        batchIndex = 1;
        console.log('Sleeping 2.2 hours');
        await sleep(1000 * 60 * 60 * 2.2); // 2.2 hours
    }
}

console.log('Finished');
