const valid = (data, callback) => {
  callback && callback(null, {
      toJSON: () => { return { statusCode: 200 } }
  });
};

const invalid = (data, callback) => {
  callback && callback(new Error('Invalid'), {
      toJSON: () => { return { statusCode: 500 } }
  });
};

module.exports = {
  valid,
  invalid
};
