const { log, dialog } = getAPI(1);
const { prompt } = dialog;

await prompt('Die');
log.log('yas');
