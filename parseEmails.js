const emailsData = document.getElementsByTagName('iframe')[0].contentWindow.document.getElementsByClassName("CardList")[0].getElementsByTagName("li");

const output = {};
for (const data of emailsData) {
    const emailName = data.getElementsByTagName("h2")[0].innerHTML;
    const emailAddress = data.getElementsByTagName("span")[1].innerHTML;
    output[emailName] = emailAddress;
};

const dataString = Object.entries(output).map(([key, value]) => `${key}:${value}`).join('\n');
copy(dataString);
