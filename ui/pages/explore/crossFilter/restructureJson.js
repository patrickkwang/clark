const restructureJson = (jsonObj, noTruth) => {
  // Convert JSON format to one that is conducive to crossfiltering/DOM binding
  const outputJson = [];

  for (let i = 0; i < jsonObj.entry.length; i += 1) {
    const entry = jsonObj.entry[i];
    const { confidences } = entry.decision;
    const jsonElement = {
      confs: Object.values(confidences),
      max_label: Object.keys(confidences).reduce((prev, current) => ((confidences[prev] > confidences[current]) ? prev : current)),
      max_conf: Math.max(...Object.values(confidences)),
      labels: Object.keys(confidences), // Redundant: Store externally ideally
      pt_id: entry.subject.reference.split('/')[1],
      // name: entry.subject.reference,
    };
    if (!noTruth) { // Don't set these up if no Truth provided
      jsonElement.true_label = entry.truth;
      jsonElement.true_conf = confidences[entry.truth];
      jsonElement.misclassified = jsonElement.max_label !== entry.truth ? 'Misclassified' : 'Correct';
    }
    outputJson.push(jsonElement);
  }
  return outputJson;
};

export default restructureJson;
