const { log, dialog, ui } = getAPI(1);
const { prompt } = dialog;
const { button } = ui;

log.obj(button().text('pog'));
