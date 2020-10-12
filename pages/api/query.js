const LIST_FEATURES_API_URL = "https://caniuse.com/process/query.php?search=";
const SUPPORT_DATA_API_URL =
  "https://caniuse.com/process/get_feat_data.php?type=support-data&feat=";

export default function (request, response) {
  const { search } = request.query;
  if (!search) {
    response.status(400).send("Error: must supply a search query param.");
    return;
  }

  return fetch(LIST_FEATURES_API_URL + search)
    .then((resp) => resp.json())
    .then((resp) =>
      resp
        .split(",")
        .filter((s) => s.startsWith("mdn"))
        .join(",")
    )
    .then((features) => fetch(SUPPORT_DATA_API_URL + features))
    .then((resp) => resp.json())
    .then((supportData) => {
      const esmSupportData = Object.fromEntries(
        Object.values(supportData).map((featureData) => [
          featureData.title,
          isFeatureEsm(featureData),
        ])
      );
      response.status(200).send(JSON.stringify(esmSupportData));
    })
    .catch((err) => {
      response.status(500).send("Error: " + err.message);
    });
}

function isFeatureEsm(supportData) {
  let reasons = [];
  for (let [browser, firstEsmVer] of Object.entries(
    getEsmSupportingBrowsers()
  )) {
    const firstFeatureVersion = getFirstSupportingVersion(supportData, browser);
    if (firstFeatureVersion > firstEsmVer) {
      reasons.push(
        `First supported by ${browser} version: ${firstFeatureVersion}, whereas ESM support begins at ${firstEsmVer}`
      );
    }
  }
  return reasons.length === 0 ? true : reasons;
}

function getFirstSupportingVersion(supportData, browser) {
  const isMdn = !!supportData.mdn_url;
  console.error(isMdn);
  if (isMdn) {
    if (!supportData.support[browser]) {
      return false;
    }
    return parseFloat(supportData.support[browser].version_added);
  }
  return 1;
}

// Copied from https://caniuse.com/process/get_feat_data.php?type=support-data&feat=es6-module
function getEsmSupportingBrowsers() {
  return {
    // Unsupported browsers:
    // - ie
    // - op_mini
    // - android
    // - bb
    // - op_mob
    // - ie_mob
    // - baidu
    // - kaios
    edge: 79,
    firefox: 60,
    chrome: 61,
    safari: 11.1,
    opera: 48,
    ios_saf: 11,
    and_chr: 85,
    and_ff: 79,
    and_qq: 10.4,
  };
}
