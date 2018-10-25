const { readdir, readFile } = require('fs');

const dir_files = (dirname) =>
  new Promise((resolve, reject) =>
    readdir(dirname, (err, filenames) => err
      ? reject(err)
      : resolve(filenames)
    )
  );

const read_file = (filePath) =>
  new Promise((resolve, reject) =>
    readFile(filePath, (err, content) => err
      ? reject(err)
      : resolve(content)
    )
  );

module.exports = {
  dir_files,
  read_file,
};
