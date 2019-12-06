import { useState, useEffect } from 'react';
import { cloneDeep } from 'lodash';
import { remote } from 'electron';

import isValidRegex from '../helperFunctions/isValidRegex';
import makeRegExpFile from '../helperFunctions/makeRegExpFile';
import addRegexColor from '../helperFunctions/addRegexColor';
import validateRegExpFile from '../helperFunctions/validateRegExpFile';
import updateCompiledExpressions from '../helperFunctions/updateCompiledExpressions';

const fs = remote.require('fs');

const initialRegex = {
  library: [],
  expressions: [],
  sections: [],
};

const columnData = {
  library: [
    {
      id: 'name',
      label: 'Name',
      width: '50%',
    },
    {
      id: 'regex',
      label: 'Reg. Exp',
      width: '50%',
    },
  ],
  expressions: [
    { id: 'name', label: 'Name' },
    { id: 'rawRegex', label: 'Reg. Exp' },
  ],
  sections: [
    { id: 'name', label: 'Name' },
    { id: 'regex', label: 'Reg. Exp' },
    { id: 'ignore', label: 'Ignore' },
  ],
};

function useRegex() {
  const [regexList, updateRegexList] = useState(initialRegex);
  const [tab, setTab] = useState(Object.keys(initialRegex)[0]);
  const [activeName, updateName] = useState('');
  const [activeRegex, updateActiveRegex] = useState('');
  const [compiled, updateCompiled] = useState('');
  const [validRegex, updateValidRegex] = useState([]);
  const [showModal, toggleModal] = useState(false);
  const [regexIndex, setRegexIndex] = useState(undefined);
  const [sectionBreak, updateSectionBreak] = useState('');
  const [ignore, updateIgnore] = useState(false);
  const [ignoreHeader, updateHeaderIgnore] = useState(false);
  const [ignoreUnnamed, updateUnnamedIgnore] = useState(false);

  function remove(i) {
    const tempRegex = cloneDeep(regexList);
    tempRegex[tab].splice(i, 1);
    updateRegexList(tempRegex);
  }

  function save() {
    const tempRegex = cloneDeep(regexList);
    if (regexList[tab].find((row, i) => regexIndex !== i && row.name === activeName)) {
      // TODO: replace this with modal error
      window.alert('a row with that name already exists');
      return;
    }
    let row = {
      name: activeName,
      regex: activeRegex,
      compiled,
    };
    row = addRegexColor(row, regexIndex);
    if (tab === 'sections') {
      row.ignore = ignore;
    }
    tempRegex[tab][regexIndex] = row;
    updateRegexList(tempRegex);
    updateName('');
    updateActiveRegex('');
    updateCompiled('');
    toggleModal(false);
  }

  function openModal(i) {
    if (i === undefined) {
      // i could be index 0
      setRegexIndex(regexList[tab].length);
    } else {
      const { name, regex } = regexList[tab][i];
      updateName(name);
      updateActiveRegex(regex);
      if (tab === 'sections') {
        const { ignore: ign } = regexList[tab][i];
        updateIgnore(ign);
      }
      updateIgnore(ignore);
      if (tab === 'expressions' && regex.startsWith('#')) {
        // do the search
        const libRegex = regexList.library.find((reg) => reg.name === regex.substring(1));
        if (libRegex) {
          updateCompiled(libRegex.regex);
        } else {
          updateCompiled('');
        }
      }
      setRegexIndex(i);
    }
    toggleModal(true);
  }

  function updateRegex(value) {
    if (tab === 'expressions' && value.startsWith('#')) { // if the expression starts with a #
      // find the label in the library and set that regex as the active value
      const regex = regexList.library.find((reg) => reg.name === value.substring(1));
      if (regex) {
        updateCompiled(regex.regex);
      } else {
        updateCompiled('');
      }
    }
    updateActiveRegex(value);
  }

  useEffect(() => {
    if (tab !== 'sections' && !showModal) {
      const tempRegexList = updateCompiledExpressions(regexList);
      updateRegexList(tempRegexList);
    }
  }, [tab, showModal]);

  useEffect(() => {
    let tempValidRegex = [];
    if (tab === 'sections') {
      if (sectionBreak) {
        if (showModal && isValidRegex(activeRegex)) {
          tempValidRegex = [{
            regex: activeRegex,
            name: activeName,
          }];
          tempValidRegex = addRegexColor(tempValidRegex, regexIndex);
        } else {
          tempValidRegex = regexList.sections.filter((regex) => {
            if (!regex.name || !isValidRegex(regex.regex)) return false;
            return true;
          });
        }
      }
    } else if (showModal) {
      const regex = compiled || activeRegex;
      if (isValidRegex(regex)) {
        tempValidRegex = [{
          regex,
          name: activeName,
        }];
        tempValidRegex = addRegexColor(tempValidRegex, regexIndex);
      }
    } else if (tab === 'expressions') {
      tempValidRegex = regexList.expressions.filter((regex) => {
        if (!regex.name || !isValidRegex(regex.regex)) return false;
        return true;
      });
    }
    updateValidRegex(tempValidRegex);
  }, [
    tab, regexList, activeRegex, showModal,
    regexIndex, activeName, compiled, sectionBreak,
  ]);

  function uploadRegex() {
    const filePath = remote.dialog.showOpenDialogSync({
      filters: [{
        name: 'JSON',
        extensions: ['json'],
      }],
    });
    if (filePath) {
      // use tab to determine the type of regex to upload
      fs.readFile(filePath[0], 'utf8', (err, data) => { // filepath is an array
        if (err) {
          console.log('something went wrong');
        } else {
          let tempRegexList = cloneDeep(regexList);
          const valid = validateRegExpFile(tab, JSON.parse(data));
          if (valid) {
            if (tab === 'sections') {
              const sections = JSON.parse(data);
              updateSectionBreak(sections.section_break);
              updateHeaderIgnore(sections.ignore_header);
              updateUnnamedIgnore(sections.ignore_unnamed_sections);
              tempRegexList[tab] = addRegexColor(sections.named_sections);
            } else {
              tempRegexList[tab] = addRegexColor(JSON.parse(data));
            }
            tempRegexList = updateCompiledExpressions(tempRegexList);
            updateRegexList(tempRegexList);
          } else {
            console.log('the file uploaded is malformed.');
          }
        }
      });
    }
  }

  function saveRegex() {
    const filePath = remote.dialog.showSaveDialogSync({
      title: 'Save file as',
      defaultPath: `clark_${tab}`,
      filters: [{
        name: 'JSON',
        extensions: ['json'],
      }],
    });
    if (filePath) {
      // use tab to determine the type of regex to save
      const regexFile = makeRegExpFile(
        tab, regexList[tab], sectionBreak, ignoreHeader, ignoreUnnamed,
      );
      fs.writeFile(filePath, regexFile, (err) => {
        if (err) {
          return console.log('something went wrong');
        }
        return console.log('the file has been saved');
      });
    }
  }

  return {
    tabs: Object.keys(initialRegex),
    tab,
    setTab,
    columns: columnData[tab],
    rows: regexList[tab],
    activeName,
    updateName,
    activeRegex,
    compiled,
    updateRegex,
    save,
    remove,
    validRegex,
    sectionBreak,
    updateSectionBreak,
    ignore,
    updateIgnore,
    ignoreHeader,
    updateHeaderIgnore,
    ignoreUnnamed,
    updateUnnamedIgnore,
    showModal,
    toggleModal,
    openModal,
    badgeNum: regexList.expressions.length + regexList.sections.length,
    uploadRegex,
    saveRegex,
  };
}

export default useRegex;
