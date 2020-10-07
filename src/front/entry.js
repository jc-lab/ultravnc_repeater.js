const axios = require('axios');
axios.get('/api/show-all-connections', {})
  .then((res) => {
    document.write(`<pre>${JSON.stringify(res.data, null, 2)}</pre>`);
  })
  .catch((err) => console.error(err));

