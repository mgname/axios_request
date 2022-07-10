import axios from "./http"

function login() {
  return axios.post('/login')
}

export default {
  login
}