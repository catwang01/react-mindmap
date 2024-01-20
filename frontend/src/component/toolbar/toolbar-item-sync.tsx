import { Button, Classes, Menu, MenuItem, Popover, PopoverInteractionKind } from "@blueprintjs/core";
import cx from "classnames";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { DbConnectionFactory } from "../../db/db";
import { iconClassName } from "../../icon";
import { UpdateSyncStatusProps } from "../../plugins/AutoSyncPlugin/plugin";
import { TimeoutError, ms, nonEmpty, promiseTimeout } from "../../utils";
import { DiagramProps } from "../mindmap";
import { MindMapToaster } from "../toaster";

export interface ToolbarItemSyncProps {
  diagramProps: DiagramProps;
  openNewModel;
  openDialog;
  closeDialog;
}

export function ToolbarItemSync(props: ToolbarItemSyncProps) {
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
          closeDialog();
          openNewModel(model);
          const updateSyncStatusProps: UpdateSyncStatusProps = {
            syncTime: new Date(),
            status: "synced",
            controller,
          }
          controller.run("updateSyncStatus", updateSyncStatusProps)
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

      const timeout = ms("5 minutes")
      promiseTimeout(pushPromise, timeout)
        .then(
          () => {
            controller.run('operation', { controller, model, opType: 'moveVersionForward' });
            const updateSyncStatusProps: UpdateSyncStatusProps = {
              syncTime: new Date(),
              status: "synced",
              controller,
            }
            controller.run("updateSyncStatus", updateSyncStatusProps)
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

  const { lastSyncTime } = controller.run("getSyncStatus", props);
  return <ToolbarItemSyncPopover
    lastSyncTime={lastSyncTime}
    onClickPull={onClickPull}
    onClickPush={onClickPush} />;
}

export interface ToolbarItemSyncPopoverProps {
  lastSyncTime: Date | null;
  onClickPull: (e) => void;
  onClickPush: (e) => void;
}

export const ToolbarItemSyncPopover = memo(
  (props: ToolbarItemSyncPopoverProps) => {
    const { lastSyncTime, onClickPull, onClickPush } = props;
    const [now, setNow] = useState<number>(Date.now());

    const syncAgo = useMemo<number | null>(
      () => nonEmpty(lastSyncTime) ? now - lastSyncTime.getTime() : null,
      [lastSyncTime, now]
    );

    const icon = useMemo(
      () => syncAgo === null || syncAgo > ms("10 seconds")
        ? iconClassName("sync_problem")
        : iconClassName("loop2"),
      [lastSyncTime, now, syncAgo]
    );

    useEffect(
      () => {
        setInterval(() => {
          console.log("setNow");
          setNow(Date.now())
        }, ms("5 seconds"));
      },
      []
    );

    const readableSyncAgo = useMemo(
      () => {
        const secs = syncAgo / 1000;
        const minutes = secs / 60;
        const hours = minutes / 60;
        if (syncAgo < ms("1 minute")) {
          return syncAgo / 1000 + "s";
        }
        else if (syncAgo < ms("1 hour")) {
          return `${secs / 60}min ${secs % 60}sec`
        }
        else if (syncAgo < ms("1 day")) {
          return `${minutes / 60}h ${minutes % 60}min`
        } else {
          return `${hours / 24}`
        }
      },
      [syncAgo]
    );

    const popoverProps = {
      interactionKind: PopoverInteractionKind.HOVER,
      popoverClassName: Classes.POPOVER_CONTENT_SIZING,
      placement: "top",
      content: <div> {nonEmpty(syncAgo) ? `Synced ${readableSyncAgo} ago` : "Not synced yet"} </div>
      ,
      target: <>
        <div className={cx("bm-toolbar-item", icon)}>
          <Popover enforceFocus={false}>
            <div className="bm-toolbar-popover-target" />
            <Menu>
              <MenuItem text="Pull" onClick={onClickPull} />
              <MenuItem text="Push" onClick={onClickPush} />
            </Menu>
          </Popover>
        </div>
      </>
    }
    // @ts-ignore
    return <Popover {...popoverProps} />
  }
);