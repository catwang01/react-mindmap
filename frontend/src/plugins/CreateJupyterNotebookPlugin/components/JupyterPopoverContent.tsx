import { Button, Classes } from '@blueprintjs/core';
import { MindMapToaster } from '../../../component/toaster';
import './styles.css';
import classNames from 'classnames';

export interface PopoverContentProps {
    titlesToShow: string[];
}

export const PopoverContent = ({ titlesToShow }: PopoverContentProps) => <div>
    <ul id="jupyter-popover-content">
        {titlesToShow.map(
            title => <li key={title}>
                <div>{title}</div>
                <Button className={Classes.POPOVER_DISMISS} text="Copy title" onClick={() => {
                    navigator.clipboard.writeText(title).then(function () {
                        MindMapToaster.show({ "message": "Note title is copied!" });
                    }, function (err) {
                        console.error('Async: Could not copy text: ', err);
                    });
                }} />
            </li>
        )}
    </ul>
    <Button className={Classes.POPOVER_DISMISS} text="Dismiss" />
</div>;