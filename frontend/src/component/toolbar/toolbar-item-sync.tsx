import { Button, Classes, Menu, MenuItem, Popover, PopoverInteractionKind } from "@blueprintjs/core";
import cx from "classnames";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { DbConnectionFactory } from "../../db/db";
import { iconClassName } from "../../icon";
import { OpType as AsyncPluginOpType, UpdateSyncStatusProps } from '../../plugins/AutoSyncPlugin';
import { TimeoutError, ms, nonEmpty, promiseTimeout } from "../../utils";
import { DiagramProps } from "../mindmap";
import { MindMapToaster } from "../toaster";
import { log } from "./log";
import { Controller, Model } from '@blink-mind/core';

export interface ToolbarItemSyncProps {
  diagramProps: DiagramProps;
  openNewModel;
  openDialog;
  closeDialog;
}

export function ToolbarItemSync(props: ToolbarItemSyncProps) {
  const dbConnection = useMemo(() => DbConnectionFactory.getDbConnection(), []);
  const { diagramProps, openNewModel, openDialog, closeDialog } = props;
  const { model, controller } = diagramProps;

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
    controller.run("setSyncingStatus", {
      controller,
      model: controller.currentModel,
      status: "downloading"
    });
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
    controller.run('setVersion', { controller, model, version: obj.extData.version });

    const handleClick = (yes: boolean) => () => {
      closeDialog();
      if (yes) {
        openNewModel(model);
        const updateSyncStatusProps: UpdateSyncStatusProps = {
          syncTime: new Date(),
          status: "synced",
          controller,
          model,
        }
        controller.run("operation", {
          opType: AsyncPluginOpType.UPDATE_SYNC_STATUS,
          controller,
          ...updateSyncStatusProps
        })
      }
      controller.run("setSyncingStatus", {
        controller,
        status: "idle",
      })
    }

    customizedOpenDialog({
      message: `Do you want to pull data from cloud\n(${model.topics.count()}, ${timestamp}) ?`,
      buttons: [
        <Button onClick={handleClick(true)}>Yes</Button>,
        <Button onClick={handleClick(false)}>No</Button>
      ]
    })
  }, []);

  const onClickPush = useCallback(e => {
    const onClickYes = async () => {
      const model = controller.currentModel;
      const json = controller.run("serializeModel", { ...diagramProps, model },);
      const version = controller.run('getVersion', { controller, model })
      json.extData.version = version;
      const jsonStr = JSON.stringify(json);
      const parentVersion = version;
      // const parentVersion = controller.run('getParentVersion', { controller, model })
      const pushPromise = dbConnection.push(jsonStr, parentVersion, version)
      log(`pushed model with version: ${version}`)

      const timeout = ms("1 minute")
      promiseTimeout(pushPromise, timeout)
        .then(
          () => {
            controller.run('moveVersionForward', {
              controller,
              model,
            })
            const updateSyncStatusProps: UpdateSyncStatusProps = {
              syncTime: new Date(),
              status: "synced",
              model,
              controller
            }
            controller.run("operation", {
              opType: AsyncPluginOpType.UPDATE_SYNC_STATUS,
              controller,
              ...updateSyncStatusProps
            })
            MindMapToaster.show({ "message": `Pushed finished!` });
          }
        )
        .catch(e => {
          if (e instanceof TimeoutError) {
            MindMapToaster.show({ "message": `Pushing failed due to time out! The current time out is ${timeout}` });
          } else {
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

  return <ToolbarItemSyncPopover
    controller={controller}
    model={model}
    onClickPull={onClickPull}
    onClickPush={onClickPush} />;
}

export interface ToolbarItemSyncPopoverProps {
  controller: Controller;
  model: Model;
  onClickPull: (e) => void;
  onClickPush: (e) => void;
}

export const ToolbarItemSyncPopover = memo(
  (props: ToolbarItemSyncPopoverProps) => {
    const { controller, model, onClickPull, onClickPush } = props;
    const { lastSyncTime } = controller.run("getSyncStatus", { model });
    log("lastSyncTime: ", lastSyncTime)
    const [now, setNow] = useState<number>(Date.now());

    const syncAgo = useMemo<number | null>(
      () => {
        if (nonEmpty(lastSyncTime)) {
          return now - lastSyncTime.getTime()
        } else {
          return null
        }
      },
      [lastSyncTime, now]
    );

    const icon = useMemo(
      () => syncAgo === null || syncAgo > ms("30 seconds")
        ? iconClassName("sync_problem")
        : iconClassName("loop2"),
      [lastSyncTime, now, syncAgo]
    );

    useEffect(
      () => {
        const timer = setInterval(() => {
          setNow(Date.now())
        }, ms("1sec"));
        return () => clearInterval(timer);
      },
      []
    );

    const readableSyncAgo = useMemo(
      () => {
        const secs = Math.floor(syncAgo / 1000);
        const minutes = Math.floor(secs / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        if (syncAgo < 0) {
          return "";
        }
        else if (syncAgo < ms("1 minute")) {
          return secs + "s";
        }
        else if (syncAgo < ms("1 hour")) {
          return `${minutes}min ${secs % 60}sec`
        }
        else if (syncAgo < ms("1 day")) {
          return `${hours}h ${minutes % 60}min`
        } else {
          return `${days}day ${hours % 24}h`
        }
      },
      [syncAgo]
    );

    const popoverProps = {
      interactionKind: PopoverInteractionKind.HOVER,
      popoverClassName: Classes.POPOVER_CONTENT_SIZING,
      placement: "bottom-left",
      minimal: true,
      content: nonEmpty(syncAgo) && syncAgo > 0 ? `Synced ${readableSyncAgo} ago` : "Not synced yet",
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
  }, (prevProps, nextProps) => {
    const { model: prevModel } = prevProps;
    const { controller, model } = nextProps;
    const { lastSyncTime: prevLastSyncTime } = controller.run("getSyncStatus", { model: prevModel });
    const { lastSyncTime } = controller.run("getSyncStatus", { model });
    return prevLastSyncTime === lastSyncTime;
  }
);