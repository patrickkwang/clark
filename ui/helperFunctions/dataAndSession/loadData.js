import API from '../../API';

import getDirPath from './getDirPath';

/**
 * Gets the directory path from user and moves them to the next step
 * @param {object} popup shows error popup if failed
 * @param {function} setLoading sets loading to false
 * @param {function} setTab sets tab to data if successful
 * @param {function} updateSteps adds data to completed steps if successful
 * @param {function} setDirPath sets the directory path to state for save
 */
function loadData(
  popup, setLoading, setTab,
  setFhirDirectory, resetState,
) {
  const dirPath = getDirPath();
  if (dirPath) {
    setLoading(true);
    API.load([dirPath], 'fhir')
      .then((result) => {
        setLoading(false);
        popup.receiveErrors(result.messages);
        setTab('data');
        setFhirDirectory(dirPath);
        resetState();
        popup.showSnackbar({
          text: 'Successfully uploaded data.',
          type: 'success',
        });
      })
      .catch((err) => {
        setLoading(false);
        // updateSteps('');
        popup.receiveErrors({});
        popup.showModal({
          disableBackdrop: false,
          error: true,
          header: 'Error',
          text: err,
          actions: [
            {
              text: 'Close',
              autoFocus: true,
              click: () => popup.toggle(false),
            },
          ],
        });
        // setDirPath('');
      });
  }
}

export default loadData;
