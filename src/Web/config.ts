import { settings } from "./Settings/settings";

export const propertyPickerStyle = settings.getPref<"classic" | "batch">("propertyPicker.style");
