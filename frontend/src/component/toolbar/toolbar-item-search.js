import React from "react";
import { OpType } from "@blink-mind/core";
import { FOCUS_MODE_SEARCH } from "@blink-mind/plugins";
import { iconClassName, IconName } from "@blink-mind/renderer-react";

export function ToolbarItemSearch(props) {
  const onClickSearch = e => {
    const { diagramProps } = props;
    const { controller } = diagramProps;

    controller.run("operation", {
      ...diagramProps,
      model: controller.currentModel,
      opType: OpType.SET_FOCUS_MODE,
      focusMode: FOCUS_MODE_SEARCH
    });
  };
  return (
    <div
      className={`bm-toolbar-item ${iconClassName(IconName.SEARCH)}`}
      onClick={onClickSearch}
    />
  );
}
