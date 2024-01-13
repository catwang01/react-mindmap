import { Dialog } from "@blueprintjs/core";
import { nonEmpty } from '../../../utils';
import React from "react";

type SimpleDialogProps =  {
    key: string;
    title: string;
    content?: string;
    buttons: JSX.Element[];
}

export const SimpleDialog: React.FC<SimpleDialogProps> = ({ key, title, content, buttons }) => {
    const dialogProps = {
        key,
        isOpen: true,
        title,
        children: <>
            {nonEmpty(content) && content}
            { buttons }
        </>
    }
    return <Dialog {...dialogProps} />
}
