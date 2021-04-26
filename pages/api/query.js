const LIST_FEATURES_API_URL = 'https://caniuse.com/process/query.php?search='
const SUPPORT_DATA_API_URL =
  'https://caniuse.com/process/get_feat_data.php?type=support-data&feat='

export default function (request, response) {
  const { search } = request.query
  if (!search) {
    response.status(400).send('Error: must supply a search query param.')
    return
  }

  return fetch(LIST_FEATURES_API_URL + search)
    .then((resp) => resp.json())
    .then((resp) => {
      return resp.featureIds.filter((s) => s.startsWith('mdn')).join(',')
    })
    .then((features) => fetch(SUPPORT_DATA_API_URL + features))
    .then((resp) => resp.json())
    .then((supportData) => {
      const esmSupportData = Object.fromEntries(
        Object.values(supportData).map((featureData) => [
          featureData.title,
          isFeatureEsm(featureData),
        ]),
      )
      response.status(200).send(JSON.stringify(esmSupportData))
    })
    .catch((err) => {
      response.status(500).send('Error: ' + err.message)
    })
}

/**
 * @param {Object} supportData
 * @returns {true | Array<[string, { esmSupport: string, featureSupport: string } | string]>}
 */
function isFeatureEsm(supportData) {
  let reasons = []
  for (let [browser, firstEsmVer] of Object.entries(
    getEsmSupportingBrowsers(),
  )) {
    const firstFeatureVersion = getFirstSupportingVersion(supportData, browser)
    if (firstFeatureVersion > firstEsmVer || !firstFeatureVersion) {
      reasons.push([
        browser,
        {
          esmSupport: firstEsmVer,
          featureSupport: firstFeatureVersion,
        },
      ])
    }
  }
  return reasons.length === 0 ? true : reasons
}

function getFirstSupportingVersion(supportData, browser) {
  const isMdn = !!supportData.mdn_url
  if (isMdn) {
    if (!supportData.support[browser]) {
      return false
    }
    if (supportData.title.includes('iterator')) {
      console.log(
        supportData.title,
        `supportData: ${JSON.stringify(supportData.support[browser])}`,
      )
    }
    const browserSupport = supportData.support[browser]
    let versionAdded = 1
    // If array, record the latest version added.
    if (Array.isArray(browserSupport)) {
      browserSupport.forEach((b) => {
        let ver = parseFloat(b.version_added)
        if (Number.isFinite(ver)) {
          versionAdded = Math.min(versionAdded, ver)
        }
      })
    } else {
      versionAdded = parseFloat(supportData.support[browser].version_added)
    }
    return versionAdded
  }
  return 1
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
    // - and_qq: 10.4. but 0.2% market share so we don't care.
    edge: 79,
    firefox: 60,
    chrome: 61,
    safari: 11.1,
    opera: 48,
    ios_saf: 11,
    and_chr: 85,
    and_ff: 79,
  }
}
