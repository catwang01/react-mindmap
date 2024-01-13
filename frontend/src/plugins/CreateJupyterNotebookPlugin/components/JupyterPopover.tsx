import { Button, Classes, Popover, PopoverInteractionKind } from '@blueprintjs/core';
import React, { useMemo } from 'react';
import { OpType } from '../opTypes';
import { getAllJupyterNotebooks, getAttachedJupyterNotebookPaths, getJupyterData } from '../utils';
import { nonEmpty } from '../../../utils';
import { useEffect } from 'react';
import { getNotesWithCache } from '../jupyterClient';

export type JupyterPopoverProps = {
    maxItemToShow: number;
    controller: any;
    model: any;
}

export const JupyterPopover = React.memo((props: JupyterPopoverProps) => {
    console.log("rendered");
    // @ts-ignore
    const { maxItemToShow, controller, model } = props;

    const allNotes = useMemo(() => getAllJupyterNotebooks({ model }), [model]);
    const existingAttachedNotePaths = useMemo(
        () => getAttachedJupyterNotebookPaths({ model }).filter(x => x !== undefined),
        [model]
    );

    const orphans = useMemo(
        () => allNotes.filter(note => !existingAttachedNotePaths.some(x => x.includes(note.getIn(["id"], null)))),
        [allNotes, existingAttachedNotePaths, model]
    );

    useEffect(
        () => {
            const initializeAllJupyterNotebooks = async () => {
                if (!nonEmpty(allNotes) || allNotes.size) return;
                const allJupyterNotebooks = await getNotesWithCache();
                console.log("get jupyter notebooks");
                console.log({ allJupyterNotebooks });
                const opType = OpType.SET_ALL_JUPYTER_NOTEBOOKS;
                controller.run("operation", {
                    opType,
                    allJupyterNotebooks,
                    controller,
                    model: controller.currentModel ?? model
                });
            };
            initializeAllJupyterNotebooks();
        }, [allNotes]
    );

    const sortedOrphans = useMemo(
        () => orphans.toJS()
                     .map(note => note.title)
                     .filter(title => nonEmpty(title) && title !== '')
                     .sort(),
        [orphans]
    );

    const titlesToShow = useMemo(() => {
        const len = sortedOrphans.length;
        if (len <= maxItemToShow) return sortedOrphans;
        const head = maxItemToShow - 3;
        const tail = maxItemToShow - head;
        return [].concat(
            sortedOrphans.slice(0, head),
            '...',
            sortedOrphans.slice(len - tail)
        );
    }, [maxItemToShow, sortedOrphans]);

    const getPopoverContent = () => <div>
        <ul>
            {titlesToShow.map(
                title => <li key={title}>{title}</li>
            )}
        </ul>
        <Button className={Classes.POPOVER_DISMISS} text="Dismiss" />
    </div>;

    const popoverProps = {
        // style: { height: "40px" },
        interactionKind: PopoverInteractionKind.CLICK,
        popoverClassName: Classes.POPOVER_CONTENT_SIZING,
        placement: "bottom",
        children: <Button
            intent="primary"
            text={`${orphans.size}/${allNotes.size} jupyter notes`} />,
        content: getPopoverContent()
    };
    // @ts-ignore
    return <Popover {...popoverProps} />;
}, (oldProps, newProps) => {
    const oldJupyterData = getJupyterData({ model: oldProps.model });
    const newJupyterData = getJupyterData({ model: newProps.model });
    const allNotesInitialized = nonEmpty(newJupyterData.getIn(["allnotes"]));
    const flag = allNotesInitialized
        && oldJupyterData.equals(newJupyterData);
    return flag;
});
