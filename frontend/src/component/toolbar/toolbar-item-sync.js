// @ts-check
import { TimeoutError, promiseTimeout } from "../../utils";
import { useCallback, useMemo, memo } from "react";
import { Button, Menu, MenuItem, Popover } from "@blueprintjs/core";
import cx from "classnames";
import React from "react";
import { DbConnectionFactory } from "../../db/db";
import { iconClassName } from "../../icon";
import { MindMapToaster } from "../toaster";

export function ToolbarItemSync(props) {
  const dbConnection = useMemo(() => DbConnectionFactory.getDbConnection(), []);
  const { diagramProps, openNewModel, openDialog, closeDialog } = props;
  const { controller } = diagramProps;

  const customizedOpenDialog = ({ message, buttons }) => {
    const openDialogProps = {
      isOpen: true,
      children: <>
        {message}
        {buttons}
      </>,
      intent: "primary",
      minimal: true
    }
    openDialog(openDialogProps)
  }

  const onClickPull = useCallback(async e => {
    let jsonBody;
    try {
      jsonBody = await dbConnection.pull()
    }
    catch (e) {
      console.log("Run into error: ", e);
      return;
    }
    const obj = JSON.parse(jsonBody.data.jsonStr)
    const timestamp = jsonBody.data.time;
    const model = controller.run("deserializeModel", { controller, obj });
    customizedOpenDialog({
      message: `Do you want to pull data from cloud\n(${model.topics.count()}, ${timestamp}) ?`,
      buttons: [
        <Button onClick={() => {
          closeDialog()
          openNewModel(model)
        }}>Yes</Button>,
        <Button onClick={closeDialog}>No</Button>
      ]
    })
  }, []);

  const onClickPush = useCallback(e => {
    const onClickYes = async () => {
      const model = controller.currentModel;
      const json = controller.run("serializeModel", { ...diagramProps, model },);
      const jsonStr = JSON.stringify(json);
      const version = controller.run('getVersion', { controller, model })
      const workingTreeVersion = controller.run('getWorkingTreeVersion', { controller, model });
      const pushPromise = dbConnection.push(jsonStr, version, workingTreeVersion)

      const timeout = 50000
      promiseTimeout(pushPromise, timeout)
        .then(
          () => {
            controller.run('operation', { controller, model, opType: 'moveVersionForward' });
            MindMapToaster.show({ "message": `Pushed finished!` });
          }
        )
        .catch(e => {
          if (e instanceof TimeoutError) {
            MindMapToaster.show({ "message": `Pushing failed due to time out! The current time out is ${timeout}` });
          } else {
            console.error(e);
            MindMapToaster.show({ "message": `Pushing failed! Error Message: ${e.message}` });
          }
        });
      MindMapToaster.show({ "message": "Pushing data to the cloud..." });
      closeDialog();
      return;
    }
    customizedOpenDialog({
      message: `Do you want to push data to the cloud (${controller.currentModel.topics.count()}) ?`,
      buttons: [
        <Button onClick={onClickYes}>Yes</Button>,
        <Button onClick={closeDialog}>No</Button>
      ]
    })
  }, []);
  return <ToolbarItemSyncPopover onClickPull={onClickPull} onClickPush={onClickPush} />;
}

export const ToolbarItemSyncPopover = memo(
  ({ onClickPull, onClickPush }) => <>
    <div className={cx("bm-toolbar-item", iconClassName("loop2"))}>
      <Popover enforceFocus={false}>
        <div className="bm-toolbar-popover-target" />
        <Menu>
          <MenuItem text="Pull" onClick={onClickPull} />
          <MenuItem text="Push" onClick={onClickPush} />
        </Menu>
      </Popover>
    </div>
  </>
);