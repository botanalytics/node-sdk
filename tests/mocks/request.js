const valid = (data, callback) => {
  callback && callback(null, { statusCode: 200 });
};

const invalid = (data, callback) => {
  callback && callback(new Error('Invalid'), { statusCode: 500 });
};

module.exports = {
  valid,
  invalid
};
