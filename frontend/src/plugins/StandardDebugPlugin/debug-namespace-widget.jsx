import {
  SettingItemButton,
  SettingItemInput,
} from './setting-item'
import { SettingRow } from './styled'
import { Checkbox, Switch } from '@blueprintjs/core';
import debug from 'debug';
import styled from 'styled-components';
import React, { useEffect, useMemo, useState } from 'react';

let log = debug('plugin:StandardDebugPlugin')

const builtInDebugNameSpaces = [
  "app",
  "app:toolbar",
  "app:evernote",
  "plugin:CreateJupyterNotebookPlugin",
  "plugin:StandardDebugPlugin",
  "plugin:DebugPlugin",
  "plugin:TopicHistoryPlugin",
  "plugin:AutoSyncPlugin",
  "plugin:AutoSaveModelPlugin",
  "plugin:VimHotKeyPlugin",
  "plugin:CounterPlugin",
  "plugin:EvernotePlugin",
  "plugin:NewSearchPlugin",
  "plugin:CopyPastePlugin",
  "node:topic-widget",
  "plugin:EnhancedOpeartionPlugin",
  "plugin:SimpleTextEditorPlugin",
];

if (!localStorage.allDebugNS)
  localStorage.allDebugNS = builtInDebugNameSpaces.join(',');

const DebugNamespaceWidgetContainer = styled.div`
  height: 400px; 
  overflow: auto
`

export function DebugNamespaceWidget(props) {
  const [enabledNS, setEnabledNS] = useState(localStorage?.debug ? localStorage.debug.split(','): []);
  const [allDebugNS, setAllDebugNS] = useState(
    localStorage.allDebugNS.split(',').sort()
  );
  const [nsName, setNsName] = useState('');
  const [selectedNS, setSelectedNS]  = useState([])
  const debugStr = useMemo(() => enabledNS.join(','), [enabledNS])

  useEffect(
    () => { 
      log("debugStr to enable:", debugStr)
      debug.enable(debugStr) 
    },
    [debugStr]
  )

  useEffect(
    () => {
      log(`selectedNS: ` + JSON.stringify(selectedNS))
    },
    [selectedNS]
  );

  useEffect(
    () => {
      log(`debugNamespaces: ` + JSON.stringify(enabledNS))
    },
    [enabledNS]
  );

  const nameProps = {
    title: 'namespace:',
    value: nsName,
    onChange: e => {
      setNsName(e.target.value);
    },
    style: {
      width: 100
    }
  };
  const addNsBtnProps = {
    title: 'Add Namespace',
    onClick:  (e) => {
      if (!nsName)
      {
        log("input value:", nsName)
        alert("Can't add a null or empty namespace")
        return ;
      }
      let _allDebugNS;
      if (allDebugNS.includes(nsName)) {
        _allDebugNS = allDebugNS.filter(i => i !== nsName);
      } else {
        _allDebugNS = [...allDebugNS, nsName];
      }

      setAllDebugNS(_allDebugNS);
      localStorage.allDebugNS = _allDebugNS.join(',');
    }
  };

  const deleteNsBtnProps = {
    title: 'Delete Namespaces',
    onClick:  (e) => {
      const filteredDebugNS = allDebugNS.filter(x => !selectedNS.includes(x));
      log({ selectedNS, filteredDebugNS })
      setAllDebugNS(filteredDebugNS);
    }
  };

  const removeOrAnd = (arr, item) => {
    let newArr = [...arr];
    if (arr.includes(item)) {
      // remove item
      newArr = arr.filter(x => x !== item);
    } else {
      // add item
      newArr.push(item);
    }
    return newArr
  }

  const checkBoxes = allDebugNS.map(item => {
    const cbProps = {
      key: `cb-${item}`,
      label: item,
      inline: true,
      checked: selectedNS.includes(item),
      onChange: e => {
        setSelectedNS(removeOrAnd(selectedNS, item));
      }
    };

    const switchProps = {
      key: `switch-${item}`,
      inline: true,
      innerLabel: "disable",
      innerLabelChecked: "enable",
      checked: enabledNS.includes(item),
      onChange: e => {
        setEnabledNS(removeOrAnd(enabledNS, item));
      }
    };
    return <div>
      <Switch {...switchProps} />
      <Checkbox {...cbProps} />
    </div>
  });

  return (
    <div>
      <SettingRow>
        <SettingItemButton {...deleteNsBtnProps} />
        <SettingItemInput {...nameProps} />
        <SettingItemButton {...addNsBtnProps} />
      </SettingRow>
      <DebugNamespaceWidgetContainer>
        {checkBoxes}
      </DebugNamespaceWidgetContainer>
    </div>
  );
}