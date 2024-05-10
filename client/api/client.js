import axios from 'axios';

// illinois
const client = axios.create({ baseURL: 'http://10.194.175.69:3011/api' });

// home
// const client = axios.create({ baseURL: 'http://10.0.0.52:3011/api' });

export default client;
