import { Controller } from "@blink-mind/core";

export class MyController extends Controller {
  // override the change interface of Controller to first change currentModel and then call onChange
  change(model, callback) {
    // @ts-ignore
    this.currentModel = model;
    // @ts-ignore
    this.onChange(model, callback);
  }
}
