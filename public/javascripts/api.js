// this function should call your URL preview api endpoint 
// it should then call the displayPreviews() function and pass it 
// the html that was returned from the api endpoint. 
// if there was an error, call the displayPreviews() function with


function getURLPreview(url) {
    const data = {previewUrl: url}
    fetch('/api/v1/previewurl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    .then(response => response.text())
    .then(response => displayPreviews(response))
    .catch(function() {
        error => displayPreviews(error)
    });
}