import { useEffect, useState } from "react";

const PAGE_BG = "#17140e"; // page bg
const PRIMARY_BG = "#252017"; // each result
const PRIMARY_FG = "#f2e8d5"; // text color
const FORM_BG = "#833502"; // search box area bg

/**
 * @returns {Object}
 */
function HomePage() {
  let [searchQuery, setSearchQuery] = React.useState();
  if (typeof window !== "undefined") {
    const startingVal = new URLSearchParams(
      window && window.location.search
    ).get("search");
    if (startingVal && startingVal !== searchQuery) {
      searchQuery = startingVal;
      setSearchQuery(startingVal);
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const searchBoxEl = Array.from(e.target.elements).find(
      (elem) => elem.id === "search-box"
    );
    const search = searchBoxEl.value;
    setSearchQuery(search);
    window.history.pushState(
      null,
      "Can I ESM",
      `/?search=${encodeURIComponent(search)}`
    );
  };

  return (
    <AppWrapper>
      <div
        style={{
          height: 100,
          width: "100%",
          backgroundColor: FORM_BG,
        }}
      >
        <div
          style={{
            position: "relative",
            height: "100%",
            width: "100%",
          }}
        >
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "row",
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            <label
              htmlFor="search-box"
              style={{
                fontSize: "2.5em",
                color: "white",
                fontWeight: 300,
                whiteSpace: "nowrap",
              }}
            >
              Can I ESM
            </label>
            <input
              id="search-box"
              autoFocus
              type="search"
              defaultValue={searchQuery}
              style={{
                display: "flex",
                flexGrow: "2",
                fontSize: 40,
                color: "white",
                padding: "3 4px",
                borderRadius: 0,
                marginLeft: 10,
                textAlign: "center",
                border: 0,
                borderBottom: "1px solid #FFF",
              }}
            />
            <label
              htmlFor="search-box"
              style={{
                fontSize: "2.5em",
                color: "white",
                fontWeight: 300,
                whiteSpace: "nowrap",
              }}
            >
              ?
            </label>
            <button type="submit" style={{ display: "none" }} />
          </form>
        </div>
      </div>
      <div>{searchQuery && <SearchResults query={searchQuery} />}</div>
    </AppWrapper>
  );
}

function AppWrapper({ children }) {
  return (
    <div style={{ backgroundColor: PAGE_BG, width: "100vw" }}>
      <main
        style={{
          width: "calc(100vw - 200px)",
          maxWidth: 1200,
          margin: "0 auto",
          minHeight: "100vh",
        }}
      >
        {children}
      </main>
      <style>{`
        html, body { margin: 0; }
        html {
          color: ${PRIMARY_FG};
          font-family: "Open Sans", Helvetica, Arial, sans-serif; 
        }

        #search-box {
          background: transparent;
        }
        #search-box:active,
        #search-box:focus,
        #search-box:hover {
          outline: none;
          background: rgba(255,255,255,0.2);
        }

        .caret-down:hover {
          cursor: pointer;
          transition:
        }

        tr {
          text-align: left;
        }
      `}</style>
    </div>
  );
}

function SearchResults({ query }) {
  const { data, error, isLoading } = useCanIEsmQuery(query);

  if (isLoading) {
    return <span>Loading...</span>;
  }
  if (error) {
    return <span>Error: {error.toString()}</span>;
  }

  return Object.entries(data).map(([featureTitle, featureData]) => {
    return (
      <>
        <Spacer height={30} />
        <FeatureResult
          key={featureTitle}
          title={featureTitle}
          canEsm={!Array.isArray(featureData)}
          supportData={featureData}
        />
      </>
    );
  });
}

function Spacer({ width, height }) {
  return <div style={{ width, height }} />;
}

function FeatureResult({ title, canEsm, supportData }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: !open ? 75 : 250,
        borderRadius: "5px",
        width: "100%",
        padding: "20px",
        backgroundColor: PRIMARY_BG,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
        }}
      >
        <span style={{ fontSize: "1.75em" }}>{title}</span>
        <Spacer width={40} />
        <div
          style={{
            height: "30px",
            width: "50px",
            backgroundColor: canEsm ? "green" : "red",
          }}
        />
        {!canEsm && (
          <>
            <span
              class="caret-down"
              style={{
                marginLeft: "auto",
                fontSize: "1.75em",
              }}
              onClick={() => setOpen(!open)}
            >
              {open ? "△" : "▽"}
            </span>
            <Spacer width={100} />
          </>
        )}
      </div>
      {open && (
        <>
          <Spacer height={20} />
          <table style={{ maxWidth: 600 }}>
            <thead>
              <tr>
                <th>Browser</th>
                <th>Min Supporting Ver</th>
                <th>ESM Supporting Ver</th>
              </tr>
            </thead>
            <tbody>
              {supportData.map(([browser, { featureSupport, esmSupport }]) => {
                return (
                  <tr>
                    <td>{browser}</td>
                    <td>{!featureSupport ? "Not supported" : featureSupport}</td>
                    <td>{esmSupport}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

/**
 * @param {string} query
 * @returns {{isLoading: boolean, data: , error: Object}}
 */
function useCanIEsmQuery(query) {
  const apiUrl = `/api/query?search=${encodeURIComponent(query)}`;
  return useFetch(apiUrl);
}

/**
 * @param {String} url
 * @returns {{error: Object | null, data: Object | null, isLoading: boolean}}
 */
function useFetch(url) {
  const [data, setData] = useState();
  const [error, setError] = useState();
  useEffect(() => {
    setData(null);
    setError(null);
    fetch(url)
      .then((r) => r.json().then(setData))
      .catch(setError);
  }, [url]);

  return { error, data, isLoading: !error && !data };
}

export default HomePage;
