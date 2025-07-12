module.exports = ({logger, makeService}) => {
  require('./warm-transfer')({logger, makeService});
  require('./dial-agent')({logger, makeService});
};

