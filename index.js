const fs = require('fs');
const { XMLParse } = require('./lib/xml');
const data = fs.readFileSync('./dummy/isclog-cutdown.xml');
const low = require('lowdb');
const FileAsync = require('lowdb/adapters/FileAsync');

const unwrapLB = arr => {
  const [level, category, msg, pid, namespace,
    timestamp, routine, requestId, tag] = arr;
  return {category, msg, pid, namespace, timestamp, routine, requestId, tag};
};

const xml = new XMLParse();
const adapter = new FileAsync('./dummy/db.json');
low(adapter).then(db => {
  xml.on('size', size => console.log(size));
  xml.on('$lb', arr => {
    const obj = unwrapLB(arr);
    console.log(obj);
    db.get('entries').push(obj).write();
  });
  db.defaults({ entries: [] }).write();
}).then(() => {
  xml.write(data);
});

