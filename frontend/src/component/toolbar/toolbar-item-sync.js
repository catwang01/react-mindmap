import cx from "classnames";
import { iconClassName } from "@blink-mind/renderer-react";
import { Menu, MenuItem, Popover } from "@blueprintjs/core";
import React, { useState } from "react";
import DbConnection from "../../db/db"

export function ToolbarItemSync(props) {

  const [showModal, setShowModal] = useState(false)

  const dbConnection = new DbConnection()

  const onClickPull = e => {
    const { diagramProps, openNewModel } = props;
    const { controller } = diagramProps;
    dbConnection.pull().then(
      (data) => {
        console.log(data)
        const obj = JSON.parse(data.data.json)
        const model = controller.run("deserializeModel", { controller, obj });
        openNewModel(model)
      }
    ).catch(e => { console.error(e) });
  }

  const onClickPush = e => {
    const { diagramProps } = props;
    const { controller } = diagramProps;

    const json = controller.run("serializeModel", { ...diagramProps, model: controller.currentModel }, );
    const jsonStr = JSON.stringify(json);
    dbConnection.push(jsonStr).then(
      (result) => {
        console.log(result)
      }
    ).catch( e => { console.error(e); }); }

  return (
    <div className={cx("bm-toolbar-item", iconClassName("export"))}>
      <Popover enforceFocus={false}>
        <div className="bm-toolbar-popover-target" />
        <Menu>
          <MenuItem text="Pull" onClick={onClickPull} />
          <MenuItem text="Push" onClick={onClickPush} />
        </Menu>
      </Popover>
    </div>
  );
}
