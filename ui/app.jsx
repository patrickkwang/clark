import React, { useState, useEffect } from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import StylesProvider from '@material-ui/styles/StylesProvider';
import CircularProgress from '@material-ui/core/CircularProgress';

import './app.css';
import 'react-virtualized/styles.css';

import API from './API';

import AppBar from './subComponents/appBar/AppBar';
import Landing from './pages/landing/Landing';
import SetupData from './pages/setupData/SetupData';
import SetupAlgo from './pages/setupAlgo/SetupAlgo';
import Explore from './pages/explore/Explore';
import DialogPopup from './subComponents/dialogPopup/DialogPopup';
import SnackbarPopup from './subComponents/snackbarPopup/SnackbarPopup';

import usePopup from './customHooks/usePopup';
import useRegex from './customHooks/useRegex';
import useMetaData from './customHooks/useMetaData';
import useAlgoSetup from './customHooks/useAlgoSetup';

import loadDataFunction from './helperFunctions/dataAndSession/loadData';
import saveSessionFunction from './helperFunctions/dataAndSession/saveSession';
import loadSessionFunction from './helperFunctions/dataAndSession/loadSession';
import pingServer from './helperFunctions/pingServer';
import buildData from './helperFunctions/buildData';

function App() {
  const [tab, setTab] = useState('landing');
  const [serverUp, updateServer] = useState(false);
  const [stepsComplete, updateSteps] = useState([]);
  const [directory, setDirPath] = useState('');
  const [dataLoading, setDataLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [result, setResult] = useState({});
  const popup = usePopup();
  const regex = useRegex(popup);
  const metaData = useMetaData(popup);
  const algo = useAlgoSetup(popup, serverUp);

  function updateCompletedSteps(value) {
    const tempSteps = new Set(stepsComplete);
    tempSteps.add(value);
    updateSteps([...tempSteps]);
  }

  function loadData() {
    loadDataFunction(
      popup, setDataLoading, setTab,
      updateCompletedSteps, setDirPath,
    );
  }

  function loadSession() {
    loadSessionFunction(
      setDirPath, updateSteps, setTab,
      metaData, regex, algo, popup,
      setSessionLoading,
    );
  }

  function saveSession() {
    saveSessionFunction(directory, stepsComplete, metaData.exportMetaData(), regex.exportRegex(), algo.exportAlgo());
  }

  function explore() {
    const data = buildData(metaData.exportMetaData(), regex.exportRegex(), algo.exportAlgo());
    // API.go(data)
    //   .then((res) => {
    //     setTab('explore');
    //     updateCompletedSteps('algo');
    //     setResult(res);
    //   })
    //   .catch((err) => {
    //     // TODO: show the error modal
    //     console.log('err', err);
    //   });
  }

  useEffect(() => {
    pingServer(popup, updateServer);
  }, []);

  return (
    <StylesProvider injectFirst>
      <CssBaseline />
      <div id="mainContainer">
        <AppBar
          tab={tab}
          setTab={setTab}
          popup={popup}
          stepsComplete={stepsComplete}
          saveSession={saveSession}
          disableSave={!directory}
        />
        <div id="content">
          {serverUp ? (
            <>
              <Landing
                tab={tab}
                dataLoading={dataLoading}
                sessionLoading={sessionLoading}
                loadData={loadData}
                loadSession={loadSession}
              />
              <SetupData
                tab={tab}
                setTab={setTab}
                updateSteps={updateCompletedSteps}
                regex={regex}
                metaData={metaData}
                popup={popup}
              />
              <SetupAlgo
                tab={tab}
                regex={regex}
                metaData={metaData}
                algo={algo}
                explore={explore}
                popup={popup}
              />
              <Explore
                tab={tab}
                result={result}
              />
            </>
          ) : (
            <>
              <CircularProgress size={150} thickness={2} />
              <h1>Loading...</h1>
            </>
          )}
        </div>
      </div>
      <DialogPopup popup={popup} />
      <SnackbarPopup popup={popup} />
    </StylesProvider>
  );
}

export default App;
