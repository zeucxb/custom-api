const btoa = require('btoa');

module.exports = (obj) => {
  const base64Obj = {};
  for(const key in obj) {
    base64Obj[key] = btoa(obj[key]);
  }
  return base64Obj;
};