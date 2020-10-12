const API_URL = "https://caniuse.com/process/query.php?search=";

export default function(request, response) {
  const { search } = request.query;
  if (!search) {
    response.status(400).send("Error: must supply a search query param.");
    return;
  }

  return fetch(API_URL + search)
    .then(resp => resp.json())
    .then(results => {
      response.status(200).send(results.split(","));
    })
    .catch(err => {
      response.status(500).send("Error: " + err.message);
    });
}
