import cx from "classnames";
import { memo } from "react";
import { iconClassName } from "@blink-mind/renderer-react";
import { Menu, MenuDivider, MenuItem, Popover } from "@blueprintjs/core";
import React, { useCallback, useMemo } from "react";
import { downloadFile } from "../../utils";

export function ToolbarItemExport(props) {
  const { diagramProps } = props;
  const { controller } = diagramProps;
  const onClickExportJson = useCallback(e => {
    const json = controller.run("serializeModel",
      {
        ...diagramProps,
        model: controller.currentModel
      }
    );
    const jsonStr = JSON.stringify(json);
    const model = controller.currentModel;
    const url = `data:text/plain,${encodeURIComponent(jsonStr)}`;
    const title = controller.run("getTopicTitle", {
      ...diagramProps,
      model,
      topicKey: model.rootTopicKey
    });
    downloadFile(url, `${title}.blinkmind`);
  }, [controller]);
  return <ToolbarItemExportPopOver onClick={onClickExportJson} />
}

export const ToolbarItemExportPopOver = memo(
  ({ onClick }) =>
    <div className={cx("bm-toolbar-item", iconClassName("export"))}>
      <Popover enforceFocus={false}>
        <div className="bm-toolbar-popover-target" />
        <Menu>
          <MenuItem text="JSON(.json)" onClick={onClick} />
          <MenuDivider />
        </Menu>
      </Popover>
    </div>
);